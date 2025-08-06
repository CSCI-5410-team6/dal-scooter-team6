import json
import os
import boto3
import random
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cognito = boto3.client('cognito-idp')

bookings_table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
users_table_name = os.environ.get('USERS_TABLE', 'DALScooterUsers1')
bikes_table_name = os.environ.get('BIKES_TABLE', 'bikes-table-dev')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
cognito_user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')

bookings_table = dynamodb.Table(bookings_table_name)
users_table = dynamodb.Table(users_table_name)
bikes_table = dynamodb.Table(bikes_table_name)

def find_franchise_owner_in_cognito(franchise_id):
    """
    Find franchise owner in Cognito User Pool by username (franchise_id)
    """
    try:
        # Get user by username (which should match the franchise_id)
        response = cognito.admin_get_user(
            UserPoolId=cognito_user_pool_id,
            Username=franchise_id
        )
        
        # Convert Cognito user attributes to a dictionary
        user_data = {}
        for attr in response['UserAttributes']:
            user_data[attr['Name']] = attr['Value']
        
        return {
            'userId': response['Username'],  # Use the Cognito username as userId
            'franchiseId': response['Username'],  # Username is the franchise ID
            'firstName': user_data.get('given_name', ''),
            'lastName': user_data.get('family_name', ''),
            'email': user_data.get('email', ''),
            'username': response['Username']
        }
        
    except cognito.exceptions.UserNotFoundException:
        print(f"User with username {franchise_id} not found in Cognito")
        return None
    except Exception as e:
        print(f"Error finding franchise owner in Cognito: {str(e)}")
        return None

def lambda_handler(event, context):
    """
    Process booking requests from SQS and assign to franchise operators
    """
    try:
        for record in event['Records']:
            message = json.loads(record['body'])
            booking_id = message.get('bookingId')
            action = message.get('action')
            
            if action == 'NEW_BOOKING_REQUEST' and booking_id:
                process_booking_request(booking_id)
        
        return {"statusCode": 200, "body": json.dumps({"status": "success"})}
        
    except Exception as e:
        print(f"Error in booking_assigner lambda: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def process_booking_request(booking_id):
    """
    Process a single booking request
    """
    try:
        # 1. Get booking details
        booking_response = bookings_table.get_item(Key={'bookingId': booking_id})
        
        if 'Item' not in booking_response:
            print(f"Booking {booking_id} not found")
            return
        
        booking = booking_response['Item']
        
        if booking.get('status') != 'REQUESTED':
            print(f"Booking {booking_id} is not in REQUESTED status")
            return
        
        # 2. Get the bike details to find the franchise owner
        bike_id = booking.get('bikeId')
        if not bike_id:
            print(f"Booking {booking_id} has no bike ID")
            return
            
        bike_response = bikes_table.get_item(Key={'bikeId': bike_id})
        
        if 'Item' not in bike_response:
            print(f"Bike {bike_id} not found")
            # Update booking status to indicate bike not found
            bookings_table.update_item(
                Key={'bookingId': booking_id},
                UpdateExpression='SET #status = :status, updatedAt = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'FAILED_BIKE_NOT_FOUND',
                    ':updated': datetime.utcnow().isoformat() + "Z"
                }
            )
            return
        
        bike = bike_response['Item']
        franchise_owner_id = bike.get('franchiseId')
        
        if not franchise_owner_id:
            print(f"Bike {bike_id} has no franchise owner")
            # Update booking status to indicate no owner
            bookings_table.update_item(
                Key={'bookingId': booking_id},
                UpdateExpression='SET #status = :status, updatedAt = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'FAILED_NO_FRANCHISE_OWNER',
                    ':updated': datetime.utcnow().isoformat() + "Z"
                }
            )
            return
        
        # 3. Verify the franchise owner exists in Cognito User Pool
        franchise_owner = find_franchise_owner_in_cognito(franchise_owner_id)
        
        if not franchise_owner:
            print(f"Franchise owner {franchise_owner_id} not found in Cognito")
            # Update booking status to indicate owner not found
            bookings_table.update_item(
                Key={'bookingId': booking_id},
                UpdateExpression='SET #status = :status, updatedAt = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'FAILED_FRANCHISE_OWNER_NOT_FOUND',
                    ':updated': datetime.utcnow().isoformat() + "Z"
                }
            )
            return
        
        # 4. Update booking with assigned franchise owner
        bookings_table.update_item(
            Key={'bookingId': booking_id},
            UpdateExpression='SET #status = :status, assignedFranchise = :franchise, updatedAt = :updated',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'PENDING_APPROVAL',
                ':franchise': franchise_owner_id,
                ':updated': datetime.utcnow().isoformat() + "Z"
            }
        )
        
        # 5. Send notification to franchise owner
        if sns_topic_arn:
            try:
                notification_message = {
                    'userId': franchise_owner.get('userId'),
                    'userEmail': franchise_owner.get('email', ''),
                    'type': 'BOOKING_APPROVAL_REQUEST',
                    'bookingId': booking_id,
                    'message': f'New booking request {booking.get("referenceCode")} requires approval for your bike {bike_id}',
                    'bookingDetails': {
                        'referenceCode': booking.get('referenceCode'),
                        'bikeId': bike_id,
                        'bikeType': bike.get('type', ''),
                        'bookingDate': booking.get('bookingDate'),
                        'slotTime': booking.get('slotTime'),
                        'customerEmail': booking.get('email')
                    }
                }
                
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(notification_message),
                    Subject=f'Booking Approval Required - {booking.get("referenceCode")} for Bike {bike_id}',
                    MessageAttributes={
                        'email': {
                            'DataType': 'String',
                            'StringValue': franchise_owner.get('email', '')
                        },
                        'type': {
                            'DataType': 'String',
                            'StringValue': 'BOOKING_APPROVAL_REQUEST'
                        }
                    }
                )
                
                print(f"Notification sent to franchise owner {franchise_owner.get('userId')} for booking {booking_id}")
                
            except Exception as sns_error:
                print(f"Failed to send SNS notification: {str(sns_error)}")
        
        print(f"Booking {booking_id} assigned to franchise owner {franchise_owner.get('userId')} (franchise: {franchise_owner_id})")
        
    except Exception as e:
        print(f"Error processing booking request {booking_id}: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
