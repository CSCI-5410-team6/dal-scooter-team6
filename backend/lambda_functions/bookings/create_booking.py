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
sqs = boto3.client('sqs')

table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
availability_table_name = os.environ.get('AVAILABILITY_TABLE', 'dev-availability-table')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
booking_requests_queue_url = os.environ.get('BOOKING_REQUESTS_QUEUE_URL')
table = dynamodb.Table(table_name)
availability_table = dynamodb.Table(availability_table_name)

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
        slot_time = body.get("slotTime")  # Single slot only e.g., "13:00"
        
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
            return response(400, {"error": f"Invalid slot time '{slot_time}'. Valid slots: {', '.join(valid_slots)}"})
        
        # Check if slot is already reserved or requested
        existing_bookings = table.scan(
            FilterExpression='bikeId = :bike_id AND bookingDate = :booking_date AND slotTime = :slot_time AND (#status = :status1 OR #status = :status2 OR #status = :status3)',
            ExpressionAttributeValues={
                ':bike_id': bike_id,
                ':booking_date': booking_date,
                ':slot_time': slot_time,
                ':status1': 'RESERVED',
                ':status2': 'REQUESTED',
                ':status3': 'PENDING_APPROVAL'
            },
            ExpressionAttributeNames={
                '#status': 'status'
            }
        )
        
        if existing_bookings.get('Items'):
            return response(409, {"error": f"Time slot {slot_time} is already reserved or has a pending request"})
        
        # Create single booking
        # Generate reference code and access code
        reference_code = generate_reference_code()
        access_code = generate_access_code()
        
        # Generate a unique bookingId
        booking_id = str(uuid.uuid4())
        
        # Create booking item
        booking_item = {
            'bookingId': booking_id,
            'referenceCode': reference_code,
            'bikeId': bike_id,
            'userId': user_id,
            'bookingDate': booking_date,
            'slotTime': slot_time,
            'accessCode': access_code,
            'email': email,
            'status': 'REQUESTED',  # Changed to REQUESTED for approval workflow
            'createdAt': datetime.utcnow().isoformat() + "Z",
            'updatedAt': datetime.utcnow().isoformat() + "Z"
        }
        
        # Save to DynamoDB
        table.put_item(Item=booking_item)
        
        # Update availability table with consistent schema
        try:
            # Use unique key for specific slot record
            unique_bike_slot_id = f"{bike_id}#{booking_date}#{slot_time}"
            
            # Try to update existing record first, create if doesn't exist
            try:
                availability_table.update_item(
                    Key={'bikeId': unique_bike_slot_id},
                    UpdateExpression='SET #status = :status, bookingId = :booking_id, updatedAt = :updated',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'UNAVAILABLE',
                        ':booking_id': booking_id,
                        ':updated': datetime.utcnow().isoformat() + "Z"
                    }
                )
                print(f"Updated existing availability for {bike_id} on {booking_date} at {slot_time} to UNAVAILABLE")
            except Exception as update_error:
                # If update fails (record doesn't exist), create new record
                availability_table.put_item(Item={
                    'bikeId': unique_bike_slot_id,  # Unique primary key for this slot
                    'originalBikeId': bike_id,      # Keep reference to original bike
                    'date': booking_date,
                    'timeSlot': slot_time,
                    'status': 'UNAVAILABLE',
                    'bookingId': booking_id,
                    'updatedAt': datetime.utcnow().isoformat() + "Z"
                })
                print(f"Created new availability record for {bike_id} on {booking_date} at {slot_time} as UNAVAILABLE")
            
        except Exception as availability_error:
            print(f"Warning: Failed to update availability: {str(availability_error)}")
            # Continue with booking creation even if availability update fails
        
        # Send to SQS for approval processing
        if booking_requests_queue_url:
            try:
                sqs.send_message(
                    QueueUrl=booking_requests_queue_url,
                    MessageBody=json.dumps({
                        'bookingId': booking_id,
                        'action': 'NEW_BOOKING_REQUEST'
                    })
                )
            except Exception as sqs_error:
                print(f"Failed to send SQS message: {str(sqs_error)}")
                # Continue with response even if SQS fails
        
        # Return single booking confirmation
        result = {
            "success": True,
            "message": "Booking request submitted for approval",
            "booking": {
                "bookingId": booking_id,
                "referenceCode": reference_code,
                "bikeId": bike_id,
                "bookingDate": booking_date,
                "slotTime": slot_time,
                "status": "REQUESTED"
            }
        }
        
        return response(202, result)  # 202 Accepted for request submitted
        
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
