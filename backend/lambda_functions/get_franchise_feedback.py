import json
import os
import boto3
from decimal import Decimal
from collections import defaultdict

dynamodb = boto3.resource('dynamodb')
feedback_table = dynamodb.Table(os.environ['FEEDBACK_TABLE'])

def lambda_handler(event, context):
    try:
        # Auth: Cognito franchise owner only
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_type = claims.get("custom:userType", "")
        
        # Franchise owners have user_type = "admin" (not "franchise")
        if user_type != "admin":
            return response(403, {"error": "Only franchise owners can access this endpoint."})
        
        franchise_id = event["pathParameters"]["franchiseId"]
        
        # Verify that the user is accessing their own franchise data
        user_franchise_id = claims.get("cognito:username")
        if user_franchise_id != franchise_id:
            return response(403, {"error": "You can only access your own franchise feedback."})
        
        # Query feedbacks for this franchiseId
        resp = feedback_table.query(
            IndexName="FranchiseIdIndex",
            KeyConditionExpression=boto3.dynamodb.conditions.Key('franchiseId').eq(franchise_id)
        )
        items = resp.get('Items', [])
        
        summary = defaultdict(lambda: {"count": 0, "sum": 0.0})
        for item in items:
            bike_id = item.get('bikeId')
            rating = float(item.get('rating', 0))
            summary[bike_id]["count"] += 1
            summary[bike_id]["sum"] += rating
        
        result = {
            "franchiseId": franchise_id,
            "bikes": [
                {
                    "bikeId": bike_id,
                    "averageRating": (data["sum"] / data["count"]) if data["count"] else None,
                    "feedbackCount": data["count"]
                } for bike_id, data in summary.items()
            ]
        }
        return response(200, result)
    except Exception as e:
        return response(500, {"error": str(e)})

def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body)
    } 