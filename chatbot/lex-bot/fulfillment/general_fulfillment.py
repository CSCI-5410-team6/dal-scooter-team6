import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    intent_name = event['sessionState']['intent']['name']
    user_type = event['sessionState']['sessionAttributes'].get('userType', 'guest')
    booking_ref = event['sessionState']['intent']['slots'].get('BookingReference', {}).get('value', {}).get('interpretedValue', '')

    if intent_name == 'NavigationIntent':
        page = event['sessionState']['intent']['slots'].get('Page', {}).get('value', {}).get('interpretedValue', 'homepage')
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': intent_name, 'state': 'Fulfilled'}
            },
            'messages': [{'contentType': 'PlainText', 'content': f'Navigating to {page}.'}]
        }
    
    if intent_name == 'BookingIntent' and booking_ref:
        if user_type == 'guest':
            return {
                'sessionState': {
                    'dialogAction': {'type': 'Close'},
                    'intent': {'name': intent_name, 'state': 'Failed'}
                },
                'messages': [{'contentType': 'PlainText', 'content': 'Please log in to access booking details.'}]
            }
        table = dynamodb.Table('bookings-table')
        response = table.get_item(Key={'bookingId': booking_ref})
        if 'Item' in response:
            item = response['Item']
            if user_type == 'customer':
                return {
                    'sessionState': {
                        'dialogAction': {'type': 'Close'},
                        'intent': {'name': intent_name, 'state': 'Fulfilled'}
                    },
                    'messages': [{'contentType': 'PlainText', 'content': f"Bike Access Code: {item['accessCode']}, Duration: {item['duration']} minutes"}]
                }
            elif user_type == 'franchise_operator':
                return {
                    'sessionState': {
                        'dialogAction': {'type': 'Close'},
                        'intent': {'name': intent_name, 'state': 'Fulfilled'}
                    },
                    'messages': [{'contentType': 'PlainText', 'content': f"Bike Number: {item['bikeNumber']}, Duration: {item['duration']} minutes"}]
                }
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': intent_name, 'state': 'Failed'}
            },
            'messages': [{'contentType': 'PlainText', 'content': 'Invalid booking reference.'}]
        }
    
    if intent_name == 'SupportIntent' and user_type == 'customer':
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Message=f"Customer support request for booking {booking_ref or 'unknown'}"
        )
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': intent_name, 'state': 'Fulfilled'}
            },
            'messages': [{'contentType': 'PlainText', 'content': 'Support request sent to franchise.'}]
        }

    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': intent_name, 'state': 'Failed'}
        },
        'messages': [{'contentType': 'PlainText', 'content': 'Sorry, I cannot assist with that request.'}]
    }