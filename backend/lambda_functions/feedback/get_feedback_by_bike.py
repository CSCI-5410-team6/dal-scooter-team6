import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
feedback_table = dynamodb.Table(os.environ['FEEDBACK_TABLE'])

def lambda_handler(event, context):
    try:
        bike_id = event["pathParameters"]["bikeId"]
        # Scan feedbacks for this bikeId (since GSI doesn't exist)
        resp = feedback_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('bikeId').eq(bike_id)
        )
        items = resp.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in resp:
            resp = feedback_table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('bikeId').eq(bike_id),
                ExclusiveStartKey=resp['LastEvaluatedKey']
            )
            items.extend(resp.get('Items', []))
            
        ratings = [float(item['rating']) for item in items if 'rating' in item]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
        for item in items:
            if 'rating' in item:
                item['rating'] = float(item['rating'])
        return response(200, {
            "bikeId": bike_id,
            "averageRating": avg_rating,
            "feedbacks": items
        })
    except Exception as e:
        print(f"Error in get_feedback_by_bike: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return response(500, {"error": str(e)})

def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body)
    } 