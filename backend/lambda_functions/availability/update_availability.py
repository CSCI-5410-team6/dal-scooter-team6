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
        updates = body.get("updates", [])  # Array of slot updates
        date = body.get("date")  # Required date field
        
        if not date:
            return response(400, {"error": "date field is required"})
            
        if not updates or not isinstance(updates, list):
            return response(400, {"error": "updates array is required with slot updates"})

        # Validate date format
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            return response(400, {"error": "Invalid date format. Use YYYY-MM-DD"})

        updated_slots = []
        
        # Process each slot update
        for update in updates:
            time_slot = update.get("timeSlot")
            status = update.get("status")
            booking_id = update.get("bookingId", "")
            
            if not time_slot or not status:
                continue
                
            if status not in ["AVAILABLE", "UNAVAILABLE", "RESERVED"]:
                continue
            
            # Create/update individual availability record for this slot
            unique_bike_slot_id = f"{bike_id}#{date}#{time_slot}"
            availability_item = {
                "bikeId": unique_bike_slot_id,  # Unique primary key for each slot
                "originalBikeId": bike_id,      # Keep reference to original bike
                "date": date,
                "timeSlot": time_slot,
                "status": status,
                "updatedBy": user_id,
                "updatedAt": datetime.now().isoformat() + "Z"
            }
            
            if booking_id:
                availability_item["bookingId"] = booking_id
            
            # Use unique key for individual slot records
            availability_table.put_item(Item=availability_item)
            updated_slots.append(f"{time_slot}:{status}")

        return response(200, {
            "message": "Availability updated successfully",
            "bikeId": bike_id,
            "date": date,
            "updatedSlots": updated_slots
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