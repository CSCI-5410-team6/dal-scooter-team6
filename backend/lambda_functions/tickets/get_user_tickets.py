import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
tickets_table = dynamodb.Table(os.environ.get('TICKETS_TABLE', 'tickets-table-dev'))

def lambda_handler(event, context):
    try:
        # Debug logging
        print("Event received:", json.dumps(event, default=str))

        # Auth: Get user info from JWT token
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub")
        user_type = claims.get("custom:userType", "")

        if not user_id:
            return response(401, {"error": "Authentication required"})

        # Get query parameters for filtering
        query_params = event.get("queryStringParameters") or {}
        status_filter = query_params.get("status")
        priority_filter = query_params.get("priority")
        category_filter = query_params.get("category")

        # Build filter expression for user's tickets
        filter_expression = "userId = :userId"
        expression_attribute_values = {":userId": user_id}

        if status_filter:
            filter_expression += " AND status = :status"
            expression_attribute_values[":status"] = status_filter

        if priority_filter:
            filter_expression += " AND priority = :priority"
            expression_attribute_values[":priority"] = priority_filter

        if category_filter:
            filter_expression += " AND category = :category"
            expression_attribute_values[":category"] = category_filter

        # Scan tickets table for user's tickets
        scan_response = tickets_table.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

        tickets = scan_response.get('Items', [])

        # Handle pagination if needed
        while "LastEvaluatedKey" in scan_response:
            scan_response = tickets_table.scan(
                FilterExpression=filter_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExclusiveStartKey=scan_response["LastEvaluatedKey"]
            )
            tickets.extend(scan_response.get('Items', []))

        # Convert Decimal objects for JSON serialization
        tickets = convert_decimal(tickets)

        # Sort by creation date (newest first)
        tickets.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

        return response(200, {
            "tickets": tickets,
            "count": len(tickets),
            "filters": {
                "status": status_filter,
                "priority": priority_filter,
                "category": category_filter
            }
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

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    } 