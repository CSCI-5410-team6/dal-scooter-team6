import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
booking_table = dynamodb.Table(os.environ['BOOKING_TABLE'])

def lambda_handler(event, context):
    try:
        # Auth: Get user info from JWT token
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")

        if not user_id:
            return response(401, {"error": "Authentication required"})

        # Only admins can access all bookings
        if user_type != "admin":
            return response(403, {"error": "Only admins can access all bookings"})

        # Scan all bookings (for admin)
        response_scan = booking_table.scan()
        bookings = response_scan.get("Items", [])

        # Handle pagination if needed
        while "LastEvaluatedKey" in response_scan:
            response_scan = booking_table.scan(
                ExclusiveStartKey=response_scan["LastEvaluatedKey"]
            )
            bookings.extend(response_scan.get("Items", []))

        # Add email information to each booking
        for booking in bookings:
            # Use email field if available, fallback to userId
            if 'email' in booking:
                booking['displayName'] = booking['email']
            elif 'mail' in booking:
                booking['displayName'] = booking['mail']
            else:
                booking['displayName'] = f"User {booking.get('userId', 'Unknown')[:8]}"

        # Convert Decimal objects for JSON serialization
        bookings = convert_decimal(bookings)

        return response(200, {
            "bookings": bookings,
            "count": len(bookings)
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

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 