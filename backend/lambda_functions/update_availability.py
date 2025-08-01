import json
import os
import boto3
from decimal import Decimal
import traceback
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table(os.environ['AVAILABILITY_TABLE'])

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

        # Only admins can update availability
        if user_type != "admin":
            return response(403, {"error": "Only admins can update availability"})

        # Get bikeId from path parameters
        path_params = event.get("pathParameters", {})
        bike_id = path_params.get("bikeId")

        if not bike_id:
            return response(400, {"error": "bikeId parameter is required"})

        # Parse request body
        body = json.loads(event.get("body", "{}"))
        is_available = body.get("isAvailable")
        time_slots = body.get("timeSlots", [])
        notes = body.get("notes", "")

        if is_available is None:
            return response(400, {"error": "isAvailable field is required"})

        # Create or update availability record
        availability_item = {
            "bikeId": bike_id,
            "isAvailable": is_available,
            "updatedBy": user_id,
            "updatedAt": datetime.now().isoformat()
        }

        if time_slots:
            availability_item["timeSlots"] = time_slots

        if notes:
            availability_item["notes"] = notes

        # Put item in DynamoDB
        availability_table.put_item(Item=availability_item)

        return response(200, {
            "message": "Availability updated successfully",
            "bikeId": bike_id,
            "isAvailable": is_available,
            "timeSlots": time_slots,
            "notes": notes
        })

    except Exception as e:
        print("Error in lambda_handler:", str(e))
        print("Traceback:", traceback.format_exc())
        return response(500, {"error": str(e)})

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "PUT,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 