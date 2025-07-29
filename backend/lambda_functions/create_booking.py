import json
import os
import boto3
import uuid
import random
import string
from datetime import datetime, date
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Get Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        email = claims.get("email", "")
        user_type = claims.get("custom:userType", "")
        
        if not user_id:
            return response(403, {"error": "Unauthorized: User identity missing."})
        
        if user_type != "customer":
            return response(403, {"error": "Only customers can create bookings."})
        
        # Validate required fields
        bike_id = body.get("bikeId")
        booking_date = body.get("bookingDate")  # YYYY-MM-DD format
        slot_time = body.get("slotTime")  # e.g., "13:00"
        
        if not all([bike_id, booking_date, slot_time]):
            return response(400, {"error": "Missing required fields: bikeId, bookingDate, slotTime"})
        
        # Validate date format
        try:
            parsed_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
        except ValueError:
            return response(400, {"error": "Invalid date format. Use YYYY-MM-DD"})
        
        # Restrict booking to today only
        today = date.today()
        if parsed_date != today:
            return response(400, {"error": "Booking is restricted to today only"})
        
        # Validate slot time (10:00 to 18:00, 1-hour intervals)
        valid_slots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
        if slot_time not in valid_slots:
            return response(400, {"error": f"Invalid slot time. Valid slots: {', '.join(valid_slots)}"})
        
        # Check if slot is already reserved
        existing_bookings = table.scan(
            FilterExpression='bikeId = :bike_id AND bookingDate = :booking_date AND slotTime = :slot_time AND #status = :status',
            ExpressionAttributeValues={
                ':bike_id': bike_id,
                ':booking_date': booking_date,
                ':slot_time': slot_time,
                ':status': 'reserved'
            },
            ExpressionAttributeNames={
                '#status': 'status'
            }
        )
        
        if existing_bookings.get('Items'):
            return response(409, {"error": "This time slot is already reserved"})
        
        # Generate reference code and access code
        reference_code = generate_reference_code()
        access_code = generate_access_code()
        
        # Generate a unique bookingId
        booking_id = str(uuid.uuid4())
        
        # Create booking item
        booking_item = {
            'bookingId': booking_id,  # <-- Add this line
            'referenceCode': reference_code,
            'bikeId': bike_id,
            'userId': user_id,
            'bookingDate': booking_date,
            'slotTime': slot_time,
            'accessCode': access_code,
            'email': email,
            'status': 'reserved',  # Changed from 'confirmed' to 'reserved'
            'createdAt': datetime.utcnow().isoformat() + "Z",
            'updatedAt': datetime.utcnow().isoformat() + "Z"
        }
        
        # Save to DynamoDB
        table.put_item(Item=booking_item)
        
        # Send SNS notification
        if sns_topic_arn:
            message = {
                "bookingConfirmation": {
                    "referenceCode": reference_code,
                    "bikeId": bike_id,
                    "bookingDate": booking_date,
                    "slotTime": slot_time,
                    "accessCode": access_code,
                    "email": email
                }
            }
            
            sns.publish(
                TopicArn=sns_topic_arn,
                Message=json.dumps(message),
                Subject=f"Booking Confirmation - {reference_code}"
            )
        
        # Return booking confirmation
        result = {
            "success": True,
            "message": "Booking created successfully",
            "booking": {
                "referenceCode": reference_code,
                "bikeId": bike_id,
                "bookingDate": booking_date,
                "slotTime": slot_time,
                "accessCode": access_code,
                "status": "reserved"
            }
        }
        
        return response(201, result)
        
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON in request body"})
    except Exception as e:
        return response(500, {"error": f"Internal server error: {str(e)}"})

def generate_reference_code():
    """Generate a unique 8-character reference code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def generate_access_code():
    """Generate a 6-digit access code"""
    return ''.join(random.choices(string.digits, k=6))

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
