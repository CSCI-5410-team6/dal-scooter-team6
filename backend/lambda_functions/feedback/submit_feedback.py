import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
feedback_table = dynamodb.Table(os.environ['FEEDBACK_TABLE'])
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])
comprehend = boto3.client('comprehend')
def lambda_handler(event, context):
    try:
        # Auth: Cognito customer only
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")
        # Get the real name from JWT token, fallback to cognito:username if name not available
        username = claims.get("name", claims.get("cognito:username", ""))
        
        if user_type != "customer":
            return response(403, {"error": "Only customers can submit feedback."})

        body = json.loads(event.get("body", "{}"))
        bike_id = body.get("bikeId")
        rating = body.get("rating")
        comment = body.get("comment", "")
        
        if not all([bike_id, rating]):
            return response(400, {"error": "Missing required fields: bikeId, rating"})

        # Fetch bike info
        bike_resp = bikes_table.get_item(Key={"bikeId": bike_id})
        bike = bike_resp.get("Item")
        if not bike:
            return response(404, {"error": "Bike not found"})
        
        bike_type = bike.get("type")

        # Optionally: perform sentiment analysis on comment (placeholder)
        # sentiment = analyze_sentiment(comment)
        sentiment_data = analyze_sentiment(comment)

        feedback_id = str(uuid.uuid4())
        submitted_at = datetime.utcnow().isoformat() + "Z"
        
        item = {
            "feedbackId": feedback_id,
            "bikeId": bike_id,
            "userId": user_id,
            "username": username,
            "rating": Decimal(str(rating)),
            "comment": comment,
            "bikeType": bike_type,
            "submittedAt": submitted_at,
            "sentiment": sentiment_data["sentiment"]
        }
        
        feedback_table.put_item(Item=item)
        
        return response(201, {
            "message": "Feedback submitted successfully", 
            "feedbackId": feedback_id,
            "userId": user_id,
            "bikeId": bike_id,
            "sentiment": sentiment_data["sentiment"]
        })
        
    except Exception as e:
        return response(500, {"error": str(e)})
def analyze_sentiment(text):
    """
    Analyze sentiment of the given text using AWS Comprehend
    Returns only sentiment (POSITIVE, NEGATIVE, NEUTRAL, MIXED)
    """
    try:
        # Skip sentiment analysis if comment is empty
        if not text or text.strip() == "":
            return {
                "sentiment": "NEUTRAL"
            }
        
        # Call AWS Comprehend to detect sentiment
        response = comprehend.detect_sentiment(
            Text=text,
            LanguageCode='en'  # Assuming English text
        )
        
        # Extract only sentiment, ignore scores
        sentiment = response['Sentiment']
        
        return {
            "sentiment": sentiment
        }
        
    except Exception as e:
        # If sentiment analysis fails, default to NEUTRAL
        print(f"Sentiment analysis failed: {str(e)}")
        return {
            "sentiment": "NEUTRAL"
        }

def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body)
    } 