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
    Get tickets for the authenticated user
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
        limit = min(int(query_params.get('limit', 50)), 100)  # Max 100 items
        
        tickets_table = dynamodb.Table(TICKETS_TABLE)
        
        # Only customers can access this endpoint
        if user_type.upper() != 'CUSTOMER':
            return response(403, {
                'error': 'FORBIDDEN',
                'message': 'Admin cannot view user tickets. This endpoint is for customers only.'
            })
        
        # Customers see only their own tickets
        filter_expression = 'userId = :userId'
        expression_values = {':userId': user_id}
        
        # Add status filter if provided
        if status_filter:
            filter_expression += ' AND #status = :status'
            expression_values[':status'] = status_filter
        
        # Add priority filter if provided
        if priority_filter:
            filter_expression += ' AND priority = :priority'
            expression_values[':priority'] = priority_filter
        
        # Scan for tickets (ideally we'd use a GSI for better performance)
        scan_kwargs = {
            'FilterExpression': filter_expression,
            'ExpressionAttributeValues': expression_values,
            'Limit': limit
        }
        
        if status_filter:
            scan_kwargs['ExpressionAttributeNames'] = {'#status': 'status'}
        
        response_data = tickets_table.scan(**scan_kwargs)
        tickets = response_data.get('Items', [])
        
        # Sort by creation date (newest first)
        sorted_tickets = sorted(tickets, key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return response(200, {
            'tickets': sorted_tickets,
            'count': len(sorted_tickets),
            'userType': user_type
        })
        
    except Exception as e:
        logger.error(f"Error getting user tickets: {str(e)}")
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
