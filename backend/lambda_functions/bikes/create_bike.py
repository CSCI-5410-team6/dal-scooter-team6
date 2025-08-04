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

        # Create individual availability records for each time slot (consistent schema)
        time_slots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
        today = datetime.utcnow().strftime('%Y-%m-%d')
        
        for slot in time_slots:
            # Use unique bikeId for each slot to avoid overwriting
            unique_bike_slot_id = f"{bike_id}#{today}#{slot}"
            availability_item = {
                "bikeId": unique_bike_slot_id,  # Unique primary key for each slot
                "originalBikeId": bike_id,      # Keep reference to original bike
                "date": today,
                "timeSlot": slot,
                "status": "AVAILABLE",
                "notes": "Default availability created with bike",
                "updatedAt": datetime.utcnow().isoformat() + "Z"
            }
            availability_table.put_item(Item=availability_item)
            print(f"Created availability record for {bike_id} on {today} at {slot}")

        # Convert Decimal to float for response
        bike_item["hourlyRate"] = float(bike_item["hourlyRate"])

        return response(201, {
            "message": "Bike created successfully",
            "bike": bike_item,
            "availability": {
                "bikeId": bike_id,
                "date": today,
                "totalSlots": len(time_slots),
                "availableSlots": time_slots,
                "status": "All slots available"
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
