import os
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('BIKES_TABLE', 'BikesTable')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        bike_id = event["pathParameters"]["bikeId"]
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_type = claims.get("custom:userType")
        franchise_id_token = claims.get("cognito:username")

        if user_type != "admin":
            return response(403, "Unauthorized: Only admin can delete a bike.")

        bike = table.get_item(Key={"bikeId": bike_id}).get("Item")
        if not bike:
            return response(404, f"Bike with ID '{bike_id}' not found.")

        franchise_id_table = bike.get("franchiseId")
        if franchise_id_token != franchise_id_table:
            return response(403, "Unauthorized: Franchise ID mismatch.")

        table.delete_item(Key={"bikeId": bike_id})
        return response(200, {"message": f"Deleted bike with ID '{bike_id}' successfully."})

    except Exception as e:
        return response(500, {"error": str(e)})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }