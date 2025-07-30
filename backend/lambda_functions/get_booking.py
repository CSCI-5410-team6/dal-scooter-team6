import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Get referenceCode from path parameters
        reference_code = event["pathParameters"]["referenceCode"]
        
        # Get Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")
        
        if not user_id:
            return response(403, {"error": "Unauthorized: User identity missing."})
        
        # Get booking from DynamoDB
        booking_response = table.scan(
            FilterExpression='referenceCode = :ref_code',
            ExpressionAttributeValues={':ref_code': reference_code}
        )
        bookings = booking_response.get('Items', [])
        if not bookings:
            return response(404, {"error": f"Booking with reference code '{reference_code}' not found."})
        booking = bookings[0]
        
        # Authorization check - users can only see their own bookings, franchise owners can see all
        if user_type != "admin" and booking.get("userId") != user_id:
            return response(403, {"error": "Unauthorized: You can only view your own bookings."})
        
        # Convert Decimal values for JSON serialization
        booking = convert_decimal(booking)
        
        # Return booking details including access code
        result = {
            "booking": {
                "referenceCode": booking.get("referenceCode"),
                "bikeId": booking.get("bikeId"),
                "bookingDate": booking.get("bookingDate"),
                "slotTime": booking.get("slotTime"),
                "accessCode": booking.get("accessCode"),
                "status": booking.get("status", "confirmed"),
                "email": booking.get("email"),
                "createdAt": booking.get("createdAt"),
                "updatedAt": booking.get("updatedAt")
            }
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
