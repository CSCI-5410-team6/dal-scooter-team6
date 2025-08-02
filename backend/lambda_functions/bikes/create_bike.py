import json
import os
import boto3
import uuid
import base64
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

bikes_table = dynamodb.Table(os.environ.get('BIKES_TABLE', 'BikesTable'))
availability_table = dynamodb.Table(os.environ.get('AVAILABILITY_TABLE', 'availability-table-dev'))
bucket_name = os.environ.get('BIKE_IMAGES_BUCKET', 'dalscooter-bike-images')


def lambda_handler(event, context):
    try:
        # Get Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_type = claims.get("custom:userType")
        franchise_id = claims.get("cognito:username")

        if user_type != "admin":
            return response(403, "Unauthorized: Only admin can create a bike.")

        # Parse request body
        body = json.loads(event.get("body", "{}"))

        # Validate required fields
        required_fields = ["bikeId", "type", "hourlyRate", "imageBase64"]
        for field in required_fields:
            if not body.get(field):
                return response(400, f"Missing required field: {field}")

        bike_id = body["bikeId"]

        # Check if bike already exists
        existing_bike = bikes_table.get_item(Key={"bikeId": bike_id})
        if existing_bike.get("Item"):
            return response(409, f"Bike with ID '{bike_id}' already exists.")

        # Upload image to S3
        image_base64 = body["imageBase64"]
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception:
            return response(400, "Invalid base64 image data.")

        image_key = f"bikes/{bike_id}-{str(uuid.uuid4())}.jpg"
        s3.put_object(
            Bucket=bucket_name,
            Key=image_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{image_key}"

        # Create bike item
        bike_item = {
            "bikeId": bike_id,
            "type": body["type"],
            "hourlyRate": Decimal(str(body["hourlyRate"])),
            "franchiseId": franchise_id,
            "status": body.get("status", "available"),
            "features": body.get("features", {}),
            "imageUrl": image_url,
            "discountCode": body.get("discountCode", ""),
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }

        # Add bike to DynamoDB
        bikes_table.put_item(Item=bike_item)

        # Create default availability record
        availability_item = {
            "bikeId": bike_id,
            "isAvailable": True,
            "timeSlots": [
                {"start": "09:00", "end": "10:00"},
                {"start": "10:00", "end": "11:00"},
                {"start": "11:00", "end": "12:00"},
                {"start": "12:00", "end": "13:00"},
                {"start": "13:00", "end": "14:00"},
                {"start": "14:00", "end": "15:00"},
                {"start": "15:00", "end": "16:00"},
                {"start": "16:00", "end": "17:00"},
                {"start": "17:00", "end": "18:00"}
            ],
            "notes": "Default availability created with bike",
            "updatedAt": datetime.utcnow().isoformat()
        }

        availability_table.put_item(Item=availability_item)

        # Convert Decimal to float for response
        bike_item["hourlyRate"] = float(bike_item["hourlyRate"])

        return response(201, {
            "message": "Bike created successfully",
            "bike": bike_item,
            "availability": {
                "bikeId": bike_id,
                "isAvailable": True,
                "timeSlots": availability_item["timeSlots"]
            }
        })

    except json.JSONDecodeError as e:
        return response(400, f"Invalid JSON in request body: {str(e)}")
    except Exception as e:
        print(f"Error in create_bike lambda: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return response(500, f"Internal server error: {str(e)}")


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
