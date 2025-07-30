import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('BIKES_TABLE', 'BikesTable')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        response = table.scan()
        bikes = response.get("Items", [])
        # Only include required attributes
        result = []
        for bike in bikes:
            filtered = {
                "bikeId": bike.get("bikeId"),
                "features": bike.get("features"),
                "franchiseId": bike.get("franchiseId"),
                "imageUrl": bike.get("imageUrl"),
                "type": bike.get("type"),
                "hourlyRate": convert_decimal(bike.get("hourlyRate"))
            }
            result.append(filtered)
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

def convert_decimal(val):
    if isinstance(val, Decimal):
        if val % 1 == 0:
            return int(val)
        else:
            return float(val)
    return val