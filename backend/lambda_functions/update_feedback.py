import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
feedback_table = dynamodb.Table(os.environ['FEEDBACK_TABLE'])

def lambda_handler(event, context):
    try:
        # Debug logging
        print("Event received:", json.dumps(event, default=str))
        
        # Get feedbackId from path parameters (handle both feedbackId and feedback-id formats)
        path_params = event.get("pathParameters", {})
        print("Path parameters:", path_params)
        
        feedback_id = path_params.get("feedbackId") or path_params.get("feedback-id")
        print("Feedback ID:", feedback_id)
        
        if not feedback_id:
            return response(400, {"error": "feedbackId parameter is required"})
        
        # Auth: Get user info from JWT token
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")
        
        if not user_id:
            return response(401, {"error": "Authentication required"})
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        rating = body.get("rating")
        comment = body.get("comment")
        
        if not rating and not comment:
            return response(400, {"error": "At least one field (rating or comment) is required"})
        
        # Get the feedback to check ownership
        feedback_response = feedback_table.get_item(Key={"feedbackId": feedback_id})
        feedback = feedback_response.get("Item")
        
        if not feedback:
            return response(404, {"error": "Feedback not found"})
        
        # Check if user owns this feedback
        if feedback.get("userId") != user_id:
            return response(403, {"error": "You can only update your own feedback"})
        
        # Prepare update expression
        update_expr = []
        expr_attr_vals = {}
        expr_attr_names = {}
        
        if rating is not None:
            update_expr.append("#R = :r")
            expr_attr_vals[":r"] = Decimal(str(rating))
            expr_attr_names["#R"] = "rating"
        
        if comment is not None:
            update_expr.append("#C = :c")
            expr_attr_vals[":c"] = comment
            expr_attr_names["#C"] = "comment"
        
        # Add updated timestamp
        update_expr.append("#U = :u")
        expr_attr_vals[":u"] = "updated"
        expr_attr_names["#U"] = "updatedAt"
        
        # Update the feedback
        feedback_table.update_item(
            Key={"feedbackId": feedback_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_attr_vals,
            ExpressionAttributeNames=expr_attr_names
        )
        
        # Get updated feedback
        updated_response = feedback_table.get_item(Key={"feedbackId": feedback_id})
        updated_feedback = updated_response.get("Item")
        
        # Convert Decimal objects for JSON serialization
        updated_feedback = convert_decimal(updated_feedback)
        
        return response(200, {
            "message": "Feedback updated successfully",
            "feedback": updated_feedback
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
            "Access-Control-Allow-Methods": "PUT,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 