import json
import os
import boto3
import uuid
from datetime import datetime
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
        username = claims.get("name") or claims.get("cognito:username", "")

        if not user_id:
            return response(401, {"error": "Authentication required"})

        # Parse request body
        body = json.loads(event.get("body", "{}"))
        subject = body.get("subject")
        description = body.get("description")
        priority = body.get("priority", "medium")  # low, medium, high
        category = body.get("category", "general")  # general, technical, billing, etc.
        bike_id = body.get("bikeId", "")  # optional

        # Validate required fields
        if not subject or not description:
            return response(400, {"error": "Subject and description are required"})

        # Validate priority
        valid_priorities = ["low", "medium", "high"]
        if priority not in valid_priorities:
            return response(400, {"error": f"Priority must be one of: {valid_priorities}"})

        # Generate ticket ID
        ticket_id = f"TKT-{str(uuid.uuid4())[:8].upper()}"

        # Create ticket record
        ticket_item = {
            "ticketId": ticket_id,
            "userId": user_id,
            "username": username,
            "userType": user_type,
            "subject": subject,
            "description": description,
            "priority": priority,
            "category": category,
            "bikeId": bike_id,
            "status": "open",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }

        # Put item in DynamoDB
        tickets_table.put_item(Item=ticket_item)

        return response(201, {
            "message": "Ticket created successfully",
            "ticketId": ticket_id,
            "status": "open",
            "createdAt": ticket_item["createdAt"]
        })

    except json.JSONDecodeError as e:
        print("Error parsing JSON body:", str(e))
        return response(400, {"error": "Invalid JSON in request body"})
    except Exception as e:
        print("Error in lambda_handler:", str(e))
        import traceback
        print("Traceback:", traceback.format_exc())
        return response(500, {"error": str(e)})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 