import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

bookings_table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
availability_table_name = os.environ.get('AVAILABILITY_TABLE', 'dev-availability-table')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

bookings_table = dynamodb.Table(bookings_table_name)
availability_table = dynamodb.Table(availability_table_name)

def lambda_handler(event, context):
    """
    Handle booking approval/rejection by franchise operators
    """
    try:
        # Get reference code from path parameters
        reference_code = event['pathParameters']['referenceCode']
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        new_status = body.get('status')
        
        # Validate status
        if new_status not in ['APPROVED', 'REJECTED']:
            return response(400, {"error": "Status must be either 'APPROVED' or 'REJECTED'"})
        
        # Get user from Cognito claims
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub") or claims.get("cognito:username")
        user_type = claims.get("custom:userType")
        
        if not user_id:
            return response(403, {"error": "Unauthorized: User identity missing"})
        
        if user_type != "admin":
            return response(403, {"error": "Unauthorized: Only franchise operators can approve bookings"})
        
        # Get booking details by reference code
        booking_response = bookings_table.scan(
            FilterExpression='referenceCode = :ref_code',
            ExpressionAttributeValues={':ref_code': reference_code}
        )
        
        if not booking_response.get('Items'):
            return response(404, {"error": "Booking not found"})
        
        booking = booking_response['Items'][0]
        booking_id = booking.get('bookingId')
        
        # Debug: Log the booking_id to ensure it's valid
        print(f"Found booking_id: {booking_id}, type: {type(booking_id)}")
        
        if not booking_id:
            return response(500, {"error": "Booking ID is missing from the booking record"})
        
        # Check if user is assigned to this booking
        assigned_franchise = booking.get('assignedFranchise')
        if assigned_franchise != user_id:
            return response(403, {"error": "Unauthorized: You are not assigned to this booking"})
        
        # Check if booking is in correct status
        if booking.get('status') != 'PENDING_APPROVAL':
            return response(400, {"error": f"Booking is not pending approval. Current status: {booking.get('status')}"})
        
        # Update booking status
        final_status = 'CONFIRMED' if new_status == 'APPROVED' else 'REJECTED'
        
        bookings_table.update_item(
            Key={'bookingId': booking_id},
            UpdateExpression='SET #status = :status, approvalTimestamp = :timestamp, updatedAt = :updated',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': final_status,
                ':timestamp': datetime.utcnow().isoformat() + "Z",
                ':updated': datetime.utcnow().isoformat() + "Z"
            }
        )
        
        # Update availability table based on approval decision
        if final_status == 'CONFIRMED':
            # APPROVED: Change availability to RESERVED
            availability_status = 'RESERVED'
        else:
            # REJECTED: Change availability back to AVAILABLE
            availability_status = 'AVAILABLE'
        
        # Update availability - find the specific slot and update
        try:
            # Use unique key for individual slot record
            unique_bike_slot_id = f"{booking.get('bikeId')}#{booking.get('bookingDate')}#{booking.get('slotTime')}"
            
            try:
                # Try to update existing record
                availability_table.update_item(
                    Key={'bikeId': unique_bike_slot_id},
                    UpdateExpression='SET #status = :status, updatedAt = :updated',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': availability_status,
                        ':updated': datetime.utcnow().isoformat() + "Z"
                    }
                )
                print(f"Updated availability for {booking.get('bikeId')} on {booking.get('bookingDate')} at {booking.get('slotTime')} to {availability_status}")
            except Exception as update_error:
                print(f"Update failed: {str(update_error)}, creating new record")
                # If update fails, create new record
                availability_table.put_item(Item={
                    'bikeId': unique_bike_slot_id,
                    'originalBikeId': booking.get('bikeId'),
                    'date': booking.get('bookingDate'),
                    'timeSlot': booking.get('slotTime'),
                    'status': availability_status,
                    'bookingId': booking_id if final_status == 'CONFIRMED' else '',
                    'updatedAt': datetime.utcnow().isoformat() + "Z"
                })
                print(f"Created new availability record for {booking.get('bikeId')} on {booking.get('bookingDate')} at {booking.get('slotTime')} as {availability_status}")
        except Exception as availability_error:
            print(f"Error updating availability: {str(availability_error)}")
            # Don't fail the entire operation if availability update fails
        
        # Send notification to customer
        if sns_topic_arn:
            try:
                notification_message = {
                    'userId': booking.get('userId'),
                    'userEmail': booking.get('email', ''),
                    'type': 'BOOKING_STATUS_UPDATE',
                    'bookingId': booking_id,
                    'status': final_status,
                    'message': f'Your booking {booking.get("referenceCode")} has been {final_status.lower()}',
                    'bookingDetails': {
                        'referenceCode': booking.get('referenceCode'),
                        'bikeId': booking.get('bikeId'),
                        'bookingDate': booking.get('bookingDate'),
                        'slotTime': booking.get('slotTime'),
                        'accessCode': booking.get('accessCode') if final_status == 'CONFIRMED' else None,
                        'statusReason': 'CONFIRMED' if final_status == 'CONFIRMED' else 'REJECTED_BY_FRANCHISE'
                    }
                }
                
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(notification_message),
                    Subject=f'Booking {final_status} - {booking.get("referenceCode")}',
                    MessageAttributes={
                        'email': {
                            'DataType': 'String',
                            'StringValue': booking.get('email', '')
                        },
                        'type': {
                            'DataType': 'String',
                            'StringValue': 'BOOKING_STATUS_UPDATE'
                        }
                    }
                )
                
            except Exception as sns_error:
                print(f"Failed to send customer notification: {str(sns_error)}")
        
        return response(200, {
            "success": True,
            "message": f"Booking {final_status.lower()} successfully",
            "booking": {
                "bookingId": booking_id,
                "referenceCode": booking.get('referenceCode'),
                "status": final_status,
                "approvalTimestamp": datetime.utcnow().isoformat() + "Z"
            }
        })
        
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON in request body"})
    except KeyError as e:
        return response(400, {"error": f"Missing required parameter: {str(e)}"})
    except Exception as e:
        print(f"Error in approve_booking lambda: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return response(500, {"error": f"Internal server error: {str(e)}"})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "PUT,OPTIONS"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
