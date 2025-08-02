import json
import os
import boto3
from datetime import datetime, date
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Get bikeId from path parameters
        bike_id = event["pathParameters"]["bikeId"]
        
        # Get optional date from query parameters
        query_params = event.get("queryStringParameters") or {}
        booking_date = query_params.get("date")
        
        # If no date provided, use today
        if not booking_date:
            booking_date = date.today().strftime("%Y-%m-%d")
        
        # Validate date format
        try:
            datetime.strptime(booking_date, "%Y-%m-%d")
        except ValueError:
            return response(400, {"error": "Invalid date format. Use YYYY-MM-DD"})
        
        # Query bookings for this bike on the specified date
        booking_response = table.scan(
            FilterExpression='bikeId = :bike_id AND bookingDate = :booking_date',
            ExpressionAttributeValues={
                ':bike_id': bike_id,
                ':booking_date': booking_date
            }
        )
        
        bookings = booking_response.get('Items', [])
        
        # Define fixed time slots (10 AM to 6 PM, 1-hour intervals)
        all_slots = [
            "10:00", "11:00", "12:00", "13:00", 
            "14:00", "15:00", "16:00", "17:00", "18:00"
        ]
        
        # Create slot status mapping
        slot_statuses = {}
        for slot in all_slots:
            slot_statuses[slot] = "available"  # Default to available
        
        # Update slot statuses based on existing bookings
        for booking in bookings:
            slot_time = convert_decimal(booking.get('slotTime'))
            status = booking.get('status')
            
            if slot_time in slot_statuses:
                if status == 'reserved':
                    slot_statuses[slot_time] = "reserved"
                elif status == 'cancelled':
                    slot_statuses[slot_time] = "available"  # Cancelled slots become available
        
        # Separate slots by status for easier frontend handling
        available_slots = [slot for slot, status in slot_statuses.items() if status == "available"]
        reserved_slots = [slot for slot, status in slot_statuses.items() if status == "reserved"]
        
        result = {
            "bikeId": bike_id,
            "date": booking_date,
            "slotStatuses": slot_statuses,
            "availableSlots": available_slots,
            "reservedSlots": reserved_slots,
            "totalSlots": len(all_slots),
            "availableCount": len(available_slots),
            "reservedCount": len(reserved_slots)
        }
        
        return response(200, result)
        
    except KeyError as e:
        return response(400, {"error": f"Missing required parameter: {str(e)}"})
    except Exception as e:
        return response(500, {"error": f"Internal server error: {str(e)}"})

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
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
