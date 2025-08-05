import json
import boto3
import os
import logging
from boto3.dynamodb.conditions import Key, Attr

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
TICKETS_TABLE = os.environ.get('TICKETS_TABLE', 'tickets-table-dev')

def lambda_handler(event, context):
    """
    Get tickets based on user role and filters
    """
    try:
        # Get user info from JWT
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")
        
        if not user_id:
            return response(401, {'error': 'Authentication required'})
        
        # Parse query parameters
        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status')
        priority_filter = query_params.get('priority')
        category_filter = query_params.get('category')
        limit = min(int(query_params.get('limit', 50)), 100)  # Max 100 items
        
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        
        # Build filter based on user type
        if user_type == 'CUSTOMER':
            # Customers see only their own tickets
            tickets = get_customer_tickets(tickets_table, user_id, status_filter, priority_filter, category_filter, limit)
        elif user_type == 'FRANCHISE':
            # Franchise operators see tickets assigned to them
            tickets = get_operator_tickets(tickets_table, user_id, status_filter, priority_filter, category_filter, limit)
        elif user_type == 'ADMIN':
            # Admins see all tickets
            tickets = get_all_tickets(tickets_table, status_filter, priority_filter, category_filter, limit)
        else:
            return response(403, {
                'error': 'FORBIDDEN',
                'message': 'Insufficient permissions'
            })
        
        # Sort tickets by creation date (newest first)
        sorted_tickets = sorted(tickets, key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return response(200, {
            'tickets': sorted_tickets,
            'count': len(sorted_tickets),
            'userType': user_type
        })
        
    except Exception as e:
        logger.error(f"Error getting tickets: {str(e)}")
        return response(500, {
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An unexpected error occurred'
        })

def get_customer_tickets(table, user_id, status_filter, priority_filter, category_filter, limit):
    """
    Get tickets for a specific customer
    """
    try:
        # Since we don't have a GSI on userId, we'll scan with filter
        filter_expression = Attr('userId').eq(user_id)
        
        # Add additional filters
        if status_filter:
            filter_expression = filter_expression & Attr('status').eq(status_filter)
        if priority_filter:
            filter_expression = filter_expression & Attr('priority').eq(priority_filter)
        if category_filter:
            filter_expression = filter_expression & Attr('category').eq(category_filter)
        
        response = table.scan(
            FilterExpression=filter_expression,
            Limit=limit
        )
        
        return response.get('Items', [])
        
    except Exception as e:
        logger.error(f"Error getting customer tickets: {str(e)}")
        return []

def get_operator_tickets(table, operator_id, status_filter, priority_filter, category_filter, limit):
    """
    Get tickets assigned to a specific operator
    """
    try:
        # Since we don't have a GSI on assignedTo, we'll scan with filter
        filter_expression = Attr('assignedTo').eq(operator_id)
        
        # Add additional filters
        if status_filter:
            filter_expression = filter_expression & Attr('status').eq(status_filter)
        if priority_filter:
            filter_expression = filter_expression & Attr('priority').eq(priority_filter)
        if category_filter:
            filter_expression = filter_expression & Attr('category').eq(category_filter)
        
        response = table.scan(
            FilterExpression=filter_expression,
            Limit=limit
        )
        
        return response.get('Items', [])
        
    except Exception as e:
        logger.error(f"Error getting operator tickets: {str(e)}")
        return []

def get_all_tickets(table, status_filter, priority_filter, category_filter, limit):
    """
    Get all tickets (admin view)
    """
    try:
        scan_kwargs = {'Limit': limit}
        
        # Build filter expression for admin queries
        filter_expressions = []
        
        if status_filter:
            filter_expressions.append(Attr('status').eq(status_filter))
        if priority_filter:
            filter_expressions.append(Attr('priority').eq(priority_filter))
        if category_filter:
            filter_expressions.append(Attr('category').eq(category_filter))
        
        if filter_expressions:
            # Combine filters with AND
            combined_filter = filter_expressions[0]
            for expr in filter_expressions[1:]:
                combined_filter = combined_filter & expr
            scan_kwargs['FilterExpression'] = combined_filter
        
        response = table.scan(**scan_kwargs)
        return response.get('Items', [])
        
    except Exception as e:
        logger.error(f"Error getting all tickets: {str(e)}")
        return []

def lambda_handler_get_single(event, context):
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
        
        # Authorization check
        if user_type == 'CUSTOMER':
            if ticket.get('userId') != user_id:
                return response(403, {
                    'error': 'FORBIDDEN',
                    'message': 'You can only view your own tickets'
                })
        elif user_type == 'FRANCHISE':
            if ticket.get('assignedTo') != user_id:
                return response(403, {
                    'error': 'FORBIDDEN',
                    'message': 'You can only view tickets assigned to you'
                })
        # Admin can view all tickets
        
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
        'body': json.dumps(body, default=str)  # Handle datetime serialization
    }
