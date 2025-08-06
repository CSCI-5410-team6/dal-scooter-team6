import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb', region_name='ca-central-1')

def lambda_handler(event, context):
    try:
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent'].get('slots')
        user_id = event.get('userId', 'unknown')
        session_attrs = event['sessionState'].get('sessionAttributes', {})

        print("Session Attributes:", session_attrs)
        user_type = session_attrs.get('userType', 'guest') or 'guest'
        print("Resolved User Type:", user_type)

        if intent_name == 'BookingIntent':
            return handle_booking_intent(slots, user_id, user_type)
        elif intent_name == 'NavigationIntent':
            return handle_navigation_intent(event)
        elif intent_name == 'SupportIntent':
            return handle_support_intent(slots)
        elif intent_name == 'BookingInfoIntent':
            return handle_booking_info_intent(slots, user_type)
        else:
            return {
                'sessionState': {
                    'dialogAction': {'type': 'Close'},
                    'intent': {'name': intent_name, 'state': 'Fulfilled'}
                },
                'messages': [{
                    'contentType': 'PlainText',
                    'content': "Sorry, I don't understand that request."
                }]
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': intent_name, 'state': 'Failed'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': f"Error: {str(e)}"
            }]
        }

def handle_booking_info_intent(slots, user_type):
    if user_type.lower() != 'customer':
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingInfoIntent', 'state': 'Failed'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': 'Please login to request access code.'
            }]
        }

    if not slots or not slots.get('BookingReferenceCode'):
        return {
            'sessionState': {
                'dialogAction': {'type': 'ElicitSlot', 'slotToElicit': 'BookingReferenceCode'},
                'intent': {'name': 'BookingInfoIntent', 'slots': slots, 'state': 'InProgress'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': 'Please provide your booking reference code.'
            }]
        }

    reference_code = slots['BookingReferenceCode']['value']['interpretedValue'].upper()
    print("Looking for reference code:", reference_code)
    print("Slots received:", json.dumps(slots))

    table = dynamodb.Table('bookings-table-dev')
    response = table.scan(
        FilterExpression=Attr('referenceCode').eq(reference_code)
    )
    items = response.get('Items', [])
    print("DynamoDB items found:", items)

    if not items:
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingInfoIntent', 'state': 'Failed'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': 'Booking not found for that reference code. Please make sure it’s correct or try again.'
            }]
        }

    booking = items[0]
    bike_id = booking.get('bikeId', 'N/A')
    slot_time = booking.get('slotTime', 'N/A')
    access_code = booking.get('accessCode', 'N/A')

    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'BookingInfoIntent', 'state': 'Fulfilled'}
        },
        'messages': [{
            'contentType': 'PlainText',
            'content': (
                f"Your booking {reference_code} unlocks Bike {bike_id}.\n"
                f"Usage duration: {slot_time} minutes.\n"
                f"Access Code: {access_code}"
            )
        }]
    }

def handle_booking_intent(slots, user_id, user_type):
    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'BookingIntent', 'state': 'Failed'}
        },
        'messages': [{
            'contentType': 'PlainText',
            'content': 'BookingIntent not implemented in this version.'
        }]
    }

def handle_navigation_intent(event):
    user_input = event.get('inputTranscript', '').lower()
    destinations = ['home', 'about', 'contact', 'service', 'complaints', 'support', 'dashboard']
    matched = next((d for d in destinations if d in user_input), 'unknown')

    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'NavigationIntent', 'state': 'Fulfilled'}
        },
        'messages': [{
            'contentType': 'PlainText',
            'content': f'Navigating to {matched}.'
        }]
    }

def handle_support_intent(slots):
    booking_ref = slots.get('BookingReference', {}).get('value', {}).get('interpretedValue', 'unknown')
    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'SupportIntent', 'state': 'Fulfilled'}
        },
        'messages': [{
            'contentType': 'PlainText',
            'content': f'Support request for booking {booking_ref} received.'
        }]
    }
