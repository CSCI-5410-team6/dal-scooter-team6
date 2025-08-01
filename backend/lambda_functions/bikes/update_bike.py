# filepath: backend/lambda_functions/update_bike.py
import os
import json
import boto3
import base64
import uuid
import decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table_name = os.environ.get('BIKES_TABLE', 'BikesTable')
bucket_name = os.environ.get('BIKE_IMAGES_BUCKET', 'dalscooter-bike-images')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        bike_id = event["pathParameters"]["bikeId"]
        body = json.loads(event.get("body", "{}"))

        # Get Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_type = claims.get("custom:userType")
        franchise_id_token = claims.get("cognito:username")

        if user_type != "admin":
            return response(403, "Unauthorized: Only admin can update a bike.")

        # Get bike from table
        bike = table.get_item(Key={"bikeId": bike_id}).get("Item")
        if not bike:
            return response(404, f"Bike with ID '{bike_id}' not found.")

        franchise_id_table = bike.get("franchiseId")
        if franchise_id_token != franchise_id_table:
            return response(403, "Unauthorized: Franchise ID mismatch.")

        update_expr = []
        expr_attr_vals = {}
        expr_attr_names = {}

        if "features" in body:
            update_expr.append("#F = :f")
            expr_attr_vals[":f"] = body["features"]
            expr_attr_names["#F"] = "features"
        if "hourlyRate" in body:
            update_expr.append("#R = :r")
            expr_attr_vals[":r"] = body["hourlyRate"]
            expr_attr_names["#R"] = "hourlyRate"
        if "discountCode" in body:
            update_expr.append("#D = :d")
            expr_attr_vals[":d"] = body["discountCode"]
            expr_attr_names["#D"] = "discountCode"
        if "imageBase64" in body and body["imageBase64"]:
            image_bytes = base64.b64decode(body["imageBase64"])
            image_key = f"bikes/{bike_id}-{str(uuid.uuid4())}.jpg"
            s3.put_object(
                Bucket=bucket_name,
                Key=image_key,
                Body=image_bytes,
                ContentType='image/jpeg'
            )
            update_expr.append("#I = :i")
            expr_attr_vals[":i"] = image_key
            expr_attr_names["#I"] = "imageKey"

        if not update_expr:
            return response(400, "No valid fields to update.")

        table.update_item(
            Key={"bikeId": bike_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_attr_vals,
            ExpressionAttributeNames=expr_attr_names
        )

        # Fetch updated bike
        updated_bike = table.get_item(Key={"bikeId": bike_id}).get("Item")
        updated_bike = convert_decimal(updated_bike)  # <-- Convert Decimal values
        return response(200, updated_bike)

    except Exception as e:
        return response(500, str(e))

def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, decimal.Decimal):
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
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }