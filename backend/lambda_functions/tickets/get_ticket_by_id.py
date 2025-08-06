import json
import boto3
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
TICKETS_TABLE = os.environ.get('TICKETS_TABLE', 'tickets-table-dev')

def lambda_handler(event, context):
    """
    Get a single ticket by ID
    """
    try:
        # Get ticket ID from path
        ticket_id = event['pathParameters']['ticketId']
        
        # Get user info from JWT
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")
        
        # Debug logging
        logger.info(f"User {user_id} with type '{user_type}' requesting ticket {ticket_id}")
        
        if not user_id:
            return response(401, {'error': 'Authentication required'})
        
        # Get ticket
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        ticket_response = tickets_table.get_item(Key={'ticketId': ticket_id})
        
        if 'Item' not in ticket_response:
            return response(404, {
                'error': 'TICKET_NOT_FOUND',
                'message': f'Ticket {ticket_id} not found'
            })
        
        ticket = ticket_response['Item']
        
        # Authorization check - Case insensitive
        user_type_upper = user_type.upper()
        
        if user_type_upper == 'CUSTOMER':
            # Customers can only view their own tickets
            if ticket.get('userId') != user_id:
                return response(403, {
                    'error': 'FORBIDDEN',
                    'message': 'You can only view your own tickets'
                })
        elif user_type_upper == 'ADMIN':
            # Admins can view all tickets
            logger.info(f"Admin {user_id} accessing ticket {ticket_id}")
        else:
            # Unknown user type
            logger.error(f"Unknown user type: '{user_type}' for user {user_id}")
            return response(403, {
                'error': 'FORBIDDEN',
                'message': f'Unknown user type: {user_type}. Expected: customer or admin'
            })
        
        return response(200, {'ticket': ticket})
        
    except Exception as e:
        logger.error(f"Error getting ticket: {str(e)}")
        return response(500, {
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An unexpected error occurred'
        })

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
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }
