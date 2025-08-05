import json
import boto3
import os
import logging
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
TICKETS_TABLE = os.environ.get('TICKETS_TABLE', 'tickets-table-dev')
USERS_TABLE = os.environ.get('USERS_TABLE', 'DALScooterUsers1')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
TICKET_SNS_ARN = os.environ.get('TICKET_SNS_ARN')

def lambda_handler(event, context):
    """
    Process SQS messages for ticket assignment
    """
    logger.info(f"Processing {len(event['Records'])} records")
    
    for record in event['Records']:
        try:
            # Parse the SQS message
            message_body = json.loads(record['body'])
            
            # Handle SNS wrapped messages
            if 'Message' in message_body:
                actual_message = json.loads(message_body['Message'])
            else:
                actual_message = message_body
            
            logger.info(f"Processing message: {actual_message}")
            
            # Route based on action type
            action = actual_message.get('action')
            
            if action == 'NEW_TICKET':
                await_process_new_ticket(actual_message)
            elif action == 'ASSIGNMENT_FAILED':
                await_retry_assignment(actual_message)
            else:
                logger.warning(f"Unknown action: {action}")
                
        except Exception as e:
            logger.error(f"Error processing record {record['messageId']}: {str(e)}")
            # Let the message go to DLQ after retries
            raise
    
    return {'statusCode': 200, 'body': 'Processing complete'}

def await_process_new_ticket(message):
    """
    Process a new ticket for assignment
    """
    try:
        ticket_id = message.get('ticketId')
        if not ticket_id:
            logger.error("No ticketId in message")
            return
        
        logger.info(f"Processing new ticket: {ticket_id}")
        
        # Get ticket details
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        ticket_response = tickets_table.get_item(Key={'ticketId': ticket_id})
        
        if 'Item' not in ticket_response:
            logger.error(f"Ticket {ticket_id} not found")
            return
        
        ticket = ticket_response['Item']
        
        # Check if already assigned (idempotency)
        if ticket.get('status', '').lower() != 'open':
            logger.info(f"Ticket {ticket_id} already processed (status: {ticket.get('status')})")
            return
        
        # Get all admin users for random assignment
        users_table = dynamodb.Table(USERS_TABLE)
        
        # Scan for admin users
        response = users_table.scan(
            FilterExpression='userType = :userType',
            ExpressionAttributeValues={
                ':userType': 'admin'
            }
        )
        
        admin_operators = response.get('Items', [])
        logger.info(f"Found {len(admin_operators)} admin users for assignment")
        
        if not admin_operators:
            # No admin users available - escalate immediately
            logger.error(f"No admin users found in system for ticket {ticket_id}")
            escalate_ticket(ticket_id)
            return
        
        # Randomly assign to one of the admin users
        selected_operator = random.choice(admin_operators)
        # Use email as the operator identifier - in your CSV, userId IS the email
        operator_email = selected_operator['userId']  # This is actually the email from your CSV
        
        logger.info(f"Assigning ticket {ticket_id} to admin operator {operator_email}")
        
        # Update ticket status
        current_time = datetime.now().isoformat()
        tickets_table.update_item(
            Key={'ticketId': ticket_id},
            UpdateExpression='SET #status = :status, assignedTo = :operator, assignedToEmail = :email, updatedAt = :updated, assignedAt = :assigned',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'assigned',
                ':operator': operator_email,  # Store the email as assignedTo
                ':email': operator_email,     # Also store in assignedToEmail for clarity
                ':updated': current_time,
                ':assigned': current_time
            }
        )
        
        # Notify the assigned operator
        if SNS_TOPIC_ARN:
            try:
                notification_message = {
                    'userId': operator_email,
                    'type': 'NEW_TICKET_ASSIGNED',
                    'ticketId': ticket_id,
                    'subject': ticket.get('subject', 'No subject'),
                    'priority': ticket.get('priority', 'medium'),
                    'category': ticket.get('category', 'general'),
                    'customerName': ticket.get('username', 'Unknown'),
                    'createdAt': ticket.get('createdAt'),
                    'message': f"New ticket {ticket_id} has been assigned to you"
                }
                
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Message=json.dumps(notification_message),
                    Subject=f'New Ticket Assignment: {ticket_id}',
                    MessageAttributes={
                        'userId': {
                            'DataType': 'String',
                            'StringValue': operator_email
                        },
                        'notificationType': {
                            'DataType': 'String',
                            'StringValue': 'TICKET_ASSIGNMENT'
                        }
                    }
                )
                logger.info(f"Sent assignment notification to operator {operator_email}")
            except Exception as e:
                logger.error(f"Failed to send notification: {str(e)}")
        
        # Also notify the customer
        if SNS_TOPIC_ARN and ticket.get('userId'):
            try:
                customer_notification = {
                    'userId': ticket['userId'],
                    'type': 'TICKET_STATUS_UPDATE',
                    'ticketId': ticket_id,
                    'newStatus': 'assigned',
                    'message': f"Your ticket {ticket_id} has been assigned to a support agent"
                }
                
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Message=json.dumps(customer_notification),
                    Subject=f'Ticket Update: {ticket_id}',
                    MessageAttributes={
                        'userId': {
                            'DataType': 'String',
                            'StringValue': ticket['userId']
                        },
                        'notificationType': {
                            'DataType': 'String',
                            'StringValue': 'TICKET_UPDATE'
                        }
                    }
                )
                logger.info(f"Sent status update to customer {ticket['userId']}")
            except Exception as e:
                logger.error(f"Failed to send customer notification: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error processing new ticket: {str(e)}")
        raise

def handle_no_operators(ticket_id, retry_count=0):
    """
    Handle the case when no admin users are available - escalate immediately
    """
    logger.error(f"No admin users available in system for ticket {ticket_id}")
    escalate_ticket(ticket_id)

def await_retry_assignment(message):
    """
    Retry assignment for a failed ticket
    """
    ticket_id = message.get('ticketId')
    retry_count = message.get('retryCount', 0)
    
    logger.info(f"Retrying assignment for ticket {ticket_id}, attempt {retry_count}")
    
    # Treat as new ticket but with retry context
    message['action'] = 'NEW_TICKET'
    await_process_new_ticket(message)

def escalate_ticket(ticket_id):
    """
    Escalate ticket when assignment fails repeatedly
    """
    logger.warning(f"Escalating ticket {ticket_id} due to repeated assignment failures")
    
    try:
        # Update ticket status to unassigned
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        current_time = datetime.now().isoformat()
        
        tickets_table.update_item(
            Key={'ticketId': ticket_id},
            UpdateExpression='SET #status = :status, updatedAt = :updated, escalatedAt = :escalated',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'unassigned',
                ':updated': current_time,
                ':escalated': current_time
            }
        )
        
        # Send admin alert
        if SNS_TOPIC_ARN:
            admin_alert = {
                'type': 'ADMIN_ALERT',
                'alertType': 'TICKET_ASSIGNMENT_FAILED',
                'ticketId': ticket_id,
                'message': f'Ticket {ticket_id} failed assignment after maximum retries',
                'timestamp': current_time,
                'severity': 'HIGH'
            }
            
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=json.dumps(admin_alert),
                Subject=f'ALERT: Ticket Assignment Failed - {ticket_id}',
                MessageAttributes={
                    'alertType': {
                        'DataType': 'String',
                        'StringValue': 'TICKET_ASSIGNMENT_FAILED'
                    },
                    'severity': {
                        'DataType': 'String',
                        'StringValue': 'HIGH'
                    }
                }
            )
            logger.info(f"Sent admin alert for ticket {ticket_id}")
            
    except Exception as e:
        logger.error(f"Failed to escalate ticket {ticket_id}: {str(e)}")
