import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
TICKETS_TABLE = os.environ.get('TICKETS_TABLE', 'tickets-table-dev')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    """
    Update ticket status and handle resolution
    """
    try:
        # Get ticket ID from path
        ticket_id = event['pathParameters']['ticketId']
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        new_status = body.get('status')
        resolution = body.get('resolution', '')
        operator_notes = body.get('operatorNotes', '')
        message = body.get('message', '')  # Resolution message/comment
        
        # Validate status
        valid_statuses = ['assigned', 'in_progress', 'resolved', 'closed']
        if new_status not in valid_statuses:
            return response(400, {
                'error': 'INVALID_STATUS',
                'message': f'Status must be one of: {valid_statuses}'
            })
        
        # Special validation for resolved status - requires resolution message
        if new_status == 'resolved' and not message:
            return response(400, {
                'error': 'RESOLUTION_MESSAGE_REQUIRED',
                'message': 'Resolution message is required when resolving a ticket'
            })
        
        # Get user info from JWT
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("email")  # This is the email from your users table
        user_type = claims.get("custom:userType", "")
        
        if not user_id:
            return response(401, {'error': 'Authentication required'})
        
        # Get current ticket
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        ticket_response = tickets_table.get_item(Key={'ticketId': ticket_id})
        
        if 'Item' not in ticket_response:
            return response(404, {
                'error': 'TICKET_NOT_FOUND',
                'message': f'Ticket {ticket_id} not found'
            })
        
        ticket = ticket_response['Item']
        
        # Authorization checks
        if user_type.upper() == 'CUSTOMER':
            # Customers cannot update ticket status
            return response(403, {
                'error': 'FORBIDDEN',
                'message': 'Customers cannot update ticket status'
            })
        elif user_type.upper() != 'ADMIN':
            return response(403, {
                'error': 'FORBIDDEN', 
                'message': 'Only admins can update ticket status'
            })
        
        # For admins, check if they are authorized to update this ticket
        assigned_to_email = ticket.get('assignedTo', '')
        
        # Admin can update if:
        # 1. They are the assigned admin (email matches), OR
        # 2. Ticket is not assigned to anyone yet, OR  
        # 3. Any admin can take over (but log for audit)
        if assigned_to_email and assigned_to_email != user_id:
            # Allow any admin to update, but log for audit
            logger.warning(f"Admin {user_id} updating ticket {ticket_id} that was assigned to {assigned_to_email}")
        
        logger.info(f"Admin {user_id} authorized to update ticket {ticket_id}")
        
        # Additional validation for resolving tickets
        if new_status == 'resolved':
            # Double-check: only admins can resolve
            if user_type.upper() != 'ADMIN':
                return response(403, {
                    'error': 'FORBIDDEN',
                    'message': 'Only admins can resolve tickets'
                })
            
            logger.info(f"Admin {user_id} resolving ticket {ticket_id} with message: {message}")
        
        # Validate status transitions
        current_status = ticket.get('status', '').lower()
        if not is_valid_status_transition(current_status, new_status):
            return response(400, {
                'error': 'INVALID_STATUS_TRANSITION',
                'message': f'Cannot transition from {current_status} to {new_status}'
            })
        
        # Prepare update
        current_time = datetime.now().isoformat()
        update_expression = 'SET #status = :status, updatedAt = :updated, lastUpdatedBy = :updater'
        expression_values = {
            ':status': new_status,
            ':updated': current_time,
            ':updater': user_id
        }
        expression_names = {'#status': 'status'}
        
        # Add resolution if provided and status is resolved/closed
        if new_status in ['resolved', 'closed'] and resolution:
            update_expression += ', resolution = :resolution, resolvedAt = :resolved'
            expression_values[':resolution'] = resolution
            expression_values[':resolved'] = current_time
        
        # Add resolution message if provided (required for resolved status)
        if message:
            update_expression += ', resolutionMessage = :resolutionMessage'
            expression_values[':resolutionMessage'] = message
        
        # Add operator notes if provided
        if operator_notes:
            update_expression += ', operatorNotes = :notes'
            expression_values[':notes'] = operator_notes
        
        # Add in_progress timestamp
        if new_status == 'in_progress' and current_status != 'in_progress':
            update_expression += ', inProgressAt = :inProgress'
            expression_values[':inProgress'] = current_time
        
        # Update the ticket
        tickets_table.update_item(
            Key={'ticketId': ticket_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
        
        logger.info(f"Updated ticket {ticket_id} status to {new_status} by {user_id}")
        
        # Send notifications
        send_status_update_notifications(ticket, new_status, resolution, user_id, user_type, message)
        
        # Get updated ticket for response
        updated_response = tickets_table.get_item(Key={'ticketId': ticket_id})
        updated_ticket = updated_response['Item']
        
        return response(200, {
            'message': 'Ticket updated successfully',
            'ticket': {
                'ticketId': ticket_id,
                'status': new_status,
                'updatedAt': current_time,
                'lastUpdatedBy': user_id,
                'resolutionMessage': message if message else None,
                'resolution': resolution if resolution else None
            }
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return response(400, {
            'error': 'INVALID_JSON',
            'message': 'Request body must be valid JSON'
        })
    except Exception as e:
        logger.error(f"Error updating ticket: {str(e)}")
        return response(500, {
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An unexpected error occurred'
        })

def is_valid_status_transition(current_status, new_status):
    """
    Validate that the status transition is allowed
    """
    valid_transitions = {
        'open': ['assigned', 'closed'],
        'assigned': ['in_progress', 'resolved', 'closed'],
        'in_progress': ['resolved', 'assigned', 'closed'],
        'resolved': ['closed', 'in_progress'],  # Allow reopening
        'closed': ['in_progress']  # Allow reopening
    }
    
    return new_status in valid_transitions.get(current_status, [])

def send_status_update_notifications(ticket, new_status, resolution, updated_by, updater_type, resolution_message=None):
    """
    Send notifications about status updates
    """
    if not SNS_TOPIC_ARN:
        return
    
    try:
        ticket_id = ticket['ticketId']
        customer_id = ticket.get('userId')
        assigned_to = ticket.get('assignedTo')
        
        # Notify customer
        if customer_id and customer_id != updated_by:
            customer_message = {
                'userId': customer_id,
                'type': 'TICKET_STATUS_UPDATE',
                'ticketId': ticket_id,
                'newStatus': new_status,
                'updatedBy': updater_type,
                'message': create_customer_message(new_status, resolution, resolution_message),
                'resolutionMessage': resolution_message if resolution_message else None
            }
            
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=json.dumps(customer_message),
                Subject=f'Ticket Update: {ticket_id}',
                MessageAttributes={
                    'userId': {'DataType': 'String', 'StringValue': customer_id},
                    'notificationType': {'DataType': 'String', 'StringValue': 'TICKET_UPDATE'}
                }
            )
        
        # Notify assigned operator (if different from updater)
        if assigned_to and assigned_to != updated_by:
            operator_message = {
                'userId': assigned_to,
                'type': 'TICKET_STATUS_UPDATE',
                'ticketId': ticket_id,
                'newStatus': new_status,
                'updatedBy': updater_type,
                'message': f'Ticket {ticket_id} status updated to {new_status}'
            }
            
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=json.dumps(operator_message),
                Subject=f'Ticket Update: {ticket_id}',
                MessageAttributes={
                    'userId': {'DataType': 'String', 'StringValue': assigned_to},
                    'notificationType': {'DataType': 'String', 'StringValue': 'TICKET_UPDATE'}
                }
            )
        
        logger.info(f"Sent status update notifications for ticket {ticket_id}")
        
    except Exception as e:
        logger.error(f"Failed to send notifications: {str(e)}")

def create_customer_message(status, resolution, resolution_message=None):
    """
    Create customer-friendly message based on status
    """
    messages = {
        'assigned': 'Your ticket has been assigned to a support agent.',
        'in_progress': 'Your ticket is being worked on by our support team.',
        'resolved': f'Your ticket has been resolved. {resolution}' if resolution else 'Your ticket has been resolved.',
        'closed': 'Your ticket has been closed.'
    }
    
    base_message = messages.get(status, f'Your ticket status has been updated to {status}.')
    
    # Add resolution message for resolved tickets
    if status == 'resolved' and resolution_message:
        base_message += f' Resolution: {resolution_message}'
    
    return base_message

def response(status_code, body):
    """
    Create standardized response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'PUT,OPTIONS'
        },
        'body': json.dumps(body)
    }
