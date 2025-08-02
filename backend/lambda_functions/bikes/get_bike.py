import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('BIKES_TABLE', 'BikesTable')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        bike_id = event["pathParameters"]["bikeId"]
        result = table.get_item(Key={"bikeId": bike_id})
        if "Item" not in result:
            return response(404, f"Bike with ID '{bike_id}' not found.")
        # Convert Decimal to int/float
        item = convert_decimal(result["Item"])
        return response(200, item)
    except Exception as e:
        return response(500, f"Internal server error: {str(e)}")

def convert_decimal(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
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