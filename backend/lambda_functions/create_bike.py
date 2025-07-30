import json
import boto3
import os
import base64
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key
 
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
 
table_name = os.environ.get('BIKES_TABLE', 'BikesTable')
bucket_name = os.environ.get('BIKE_IMAGES_BUCKET', 'dalscooter-bike-images')
 
table = dynamodb.Table(table_name)
 
VALID_BIKE_TYPES = {"ebike", "gyroscooter", "segway"}
 
def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
 
        bike_id = body.get("bikeId")
        bike_type = body.get("type")
        features = body.get("features")
        hourly_rate = body.get("hourlyRate")
        discount_code = body.get("discountCode", "")
        image_base64 = body.get("imageBase64")
 
        # Validate required fields
        if not all([bike_id, bike_type, features, hourly_rate, image_base64]):
            return response(400, "Missing required fields including imageBase64.")
 
        if bike_type not in VALID_BIKE_TYPES:
            return response(400, f"Invalid bike type '{bike_type}'.")
 
        # Get franchiseId from Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})

        user_type = claims.get("custom:userType")
        if user_type != "admin":
            return response(403, "Unauthorized: Only admin can add a bike.")

        franchise_id = claims.get("cognito:username")
        if not franchise_id:
            return response(403, "Unauthorized: Franchise identity missing.")
 
        # Check if bike already exists
        existing = table.get_item(Key={"bikeId": bike_id})
        if "Item" in existing:
            return response(409, f"Bike with ID '{bike_id}' already exists.")
 
        # Upload image to S3
        image_bytes = base64.b64decode(image_base64)
        image_key = f"bikes/{bike_id}-{str(uuid.uuid4())}.jpg"
 
        s3.put_object(
            Bucket=bucket_name,
            Key=image_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )
 
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{image_key}"
 
        # Create record
        item = {
            "bikeId": bike_id,
            "type": bike_type,
            "features": features,
            "hourlyRate": hourly_rate,
            "discountCode": discount_code,
            "imageUrl": image_url,
            "franchiseId": franchise_id,
            "createdAt": datetime.utcnow().isoformat()
        }
 
        table.put_item(Item=item)
 
        return response(201, {
            "message": "Bike created successfully.",
            "bikeId": bike_id,
            "imageUrl": image_url
        })
 
    except Exception as e:
        return response(500, f"Internal server error: {str(e)}")
 
 
def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }