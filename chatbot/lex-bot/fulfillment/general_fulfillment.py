import json
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ca-central-1')

def lambda_handler(event, context):
    try:
        intent_name = event['sessionState']['intent']['name']
        slots = event['sessionState']['intent']['slots']
        user_id = event.get('userId', 'unknown')
        user_type = event.get('userType', 'guest')

        if intent_name == 'BookingIntent':
            return handle_booking_intent(slots, user_id, user_type)
        elif intent_name == 'NavigationIntent':
            return handle_navigation_intent(slots)
        elif intent_name == 'SupportIntent':
            return handle_support_intent(slots)
        else:
            return {
                'sessionState': {
                    'dialogAction': {'type': 'Close'},
                    'intent': {'name': intent_name, 'state': 'Fulfilled'}
                },
                'messages': [{'contentType': 'PlainText', 'content': 'Sorry, I don\'t understand that request.'}]
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': intent_name, 'state': 'Failed'}
            },
            'messages': [{'contentType': 'PlainText', 'content': f'Error: {str(e)}'}]
        }

def handle_booking_intent(slots, user_id, user_type):
    if user_type != 'customer':
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingIntent', 'state': 'Failed'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': 'Only customers can create or retrieve bookings.'
            }]
        }

    action = slots.get('BookingAction', {}).get('value', {}).get('interpretedValue')

    if action == 'create':
        start_time = slots.get('StartTime', {}).get('value', {}).get('interpretedValue')
        end_time = slots.get('EndTime', {}).get('value', {}).get('interpretedValue')
        franchise_id = slots.get('FranchiseId', {}).get('value', {}).get('interpretedValue')
        vehicle_type = slots.get('VehicleType', {}).get('value', {}).get('interpretedValue')

        missing_slots = []
        if not start_time:
            missing_slots.append('StartTime')
        if not end_time:
            missing_slots.append('EndTime')
        if not franchise_id:
            missing_slots.append('FranchiseId')
        if not vehicle_type:
            missing_slots.append('VehicleType')

        if missing_slots:
            return {
                'sessionState': {
                    'dialogAction': {
                        'type': 'ElicitSlot',
                        'slotToElicit': missing_slots[0]
                    },
                    'intent': {
                        'name': 'BookingIntent',
                        'slots': slots,
                        'state': 'InProgress'
                    }
                },
                'messages': [{
                    'contentType': 'PlainText',
                    'content': f'Please provide the {missing_slots[0]}.'
                }]
            }

        booking_id = str(uuid.uuid4())

        table = dynamodb.Table('bookings-table-dev')
        table.put_item(Item={
            'BookingId': booking_id,
            'UserId': user_id,
            'StartTime': start_time,
            'EndTime': end_time,
            'FranchiseId': franchise_id,
            'VehicleType': vehicle_type,
            'Status': 'confirmed',
            'CreatedAt': datetime.utcnow().isoformat()
        })

        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingIntent', 'state': 'Fulfilled'}
            },
            'messages': [{
                'contentType': 'PlainText',
                'content': (
                    f'Booking created successfully!\n'
                    f'Booking ID: {booking_id}\n'
                    f'Start Time: {start_time}\n'
                    f'End Time: {end_time}\n'
                    f'Franchise ID: {franchise_id}\n'
                    f'Vehicle Type: {vehicle_type}'
                )
            }]
        }

    elif action == 'retrieve':
        booking_id = slots.get('BookingId', {}).get('value', {}).get('interpretedValue')
        if not booking_id:
            return {
                'sessionState': {
                    'dialogAction': {'type': 'ElicitSlot', 'slotToElicit': 'BookingId'},
                    'intent': {'name': 'BookingIntent', 'slots': slots, 'state': 'InProgress'}
                },
                'messages': [{'contentType': 'PlainText', 'content': 'Please provide the booking ID.'}]
            }

        table = dynamodb.Table('bookings-table-dev')
        response = table.get_item(Key={'BookingId': booking_id})
        booking = response.get('Item')
        if not booking:
            return {
                'sessionState': {
                    'dialogAction': {'type': 'Close'},
                    'intent': {'name': 'BookingIntent', 'state': 'Failed'}
                },
                'messages': [{'contentType': 'PlainText', 'content': 'Booking not found.'}]
            }

        # Format booking info for response
        booking_info = (
            f"Booking ID: {booking.get('BookingId')}\n"
            f"User ID: {booking.get('UserId')}\n"
            f"Start Time: {booking.get('StartTime')}\n"
            f"End Time: {booking.get('EndTime')}\n"
            f"Franchise ID: {booking.get('FranchiseId')}\n"
            f"Vehicle Type: {booking.get('VehicleType')}\n"
            f"Status: {booking.get('Status')}\n"
            f"Created At: {booking.get('CreatedAt')}"
        )

        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingIntent', 'state': 'Fulfilled'}
            },
            'messages': [{'contentType': 'PlainText', 'content': booking_info}]
        }
    else:
        return {
            'sessionState': {
                'dialogAction': {'type': 'Close'},
                'intent': {'name': 'BookingIntent', 'state': 'Failed'}
            },
            'messages': [{'contentType': 'PlainText', 'content': 'Invalid booking action.'}]
        }

def handle_navigation_intent(slots):
    location = slots.get('Location', {}).get('value', {}).get('interpretedValue', 'unknown')
    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'NavigationIntent', 'state': 'Fulfilled'}
        },
        'messages': [{'contentType': 'PlainText', 'content': f'Navigating to {location}.'}]
    }

def handle_support_intent(slots):
    booking_ref = slots.get('BookingReference', {}).get('value', {}).get('interpretedValue', 'unknown')
    return {
        'sessionState': {
            'dialogAction': {'type': 'Close'},
            'intent': {'name': 'SupportIntent', 'state': 'Fulfilled'}
        },
        'messages': [{'contentType': 'PlainText', 'content': f'Support request for booking {booking_ref} received.'}]
    }
