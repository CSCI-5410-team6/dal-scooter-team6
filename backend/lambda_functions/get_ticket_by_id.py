import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
tickets_table = dynamodb.Table(os.environ.get('TICKETS_TABLE', 'tickets-table-dev'))

def lambda_handler(event, context):
    try:
        # Debug logging
        print("Event received:", json.dumps(event, default=str))

        # Auth: Get user info from JWT token
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")

        if not user_id:
            return response(401, {"error": "Authentication required"})

        # Get ticketId from path parameters
        path_params = event.get("pathParameters", {})
        ticket_id = path_params.get("ticketId")

        if not ticket_id:
            return response(400, {"error": "ticketId parameter is required"})

        # Get ticket from DynamoDB
        try:
            ticket_response = tickets_table.get_item(Key={'ticketId': ticket_id})
            ticket = ticket_response.get('Item')
        except Exception as e:
            print(f"Error getting ticket {ticket_id}: {str(e)}")
            return response(500, {"error": "Error retrieving ticket"})

        if not ticket:
            return response(404, {"error": "Ticket not found"})

        # Convert Decimal objects for JSON serialization
        ticket = convert_decimal(ticket)

        # Authorization: Users can only view their own tickets, admins can view all
        ticket_user_id = ticket.get('userId')
        if user_type != "admin" and ticket_user_id != user_id:
            return response(403, {"error": "You can only view your own tickets"})

        return response(200, {
            "ticket": ticket
        })

    except Exception as e:
        print("Error in lambda_handler:", str(e))
        import traceback
        print("Traceback:", traceback.format_exc())
        return response(500, {"error": str(e)})

def convert_decimal(obj):
    """Convert Decimal objects to int/float for JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 