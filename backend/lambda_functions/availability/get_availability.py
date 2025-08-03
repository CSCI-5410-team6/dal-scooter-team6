import json
import os
import boto3
from datetime import datetime, date
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bookings_table_name = os.environ.get('BOOKINGS_TABLE', 'bookings-table-dev')
availability_table_name = os.environ.get('AVAILABILITY_TABLE', 'dev-availability-table')
bookings_table = dynamodb.Table(bookings_table_name)
availability_table = dynamodb.Table(availability_table_name)

def lambda_handler(event, context):
    try:
        print(f"Event: {json.dumps(event)}")
        
        # Get bikeId from path parameters
        bike_id = event["pathParameters"]["bikeId"]
        print(f"BikeId: {bike_id}")
        
        # Get optional date from query parameters
        query_params = event.get("queryStringParameters") or {}
        booking_date = query_params.get("date")
        
        # If no date provided, use today
        if not booking_date:
            booking_date = date.today().strftime("%Y-%m-%d")
        
        print(f"Booking date: {booking_date}")
        
        # Validate date format
        try:
            datetime.strptime(booking_date, "%Y-%m-%d")
        except ValueError:
            return response(400, {"error": "Invalid date format. Use YYYY-MM-DD"})
        
        # Define fixed time slots (10 AM to 6 PM, 1-hour intervals)
        all_slots = [
            "10:00", "11:00", "12:00", "13:00", 
            "14:00", "15:00", "16:00", "17:00", "18:00"
        ]
        
        # Create slot status mapping with default availability
        slot_statuses = {}
        for slot in all_slots:
            slot_statuses[slot] = "available"  # Default to available
        
        # Check availability table for this bike and date
        try:
            print(f"Checking availability for bike {bike_id} on {booking_date}")
            # Query all slots for this bike on this date
            all_availability_records = []
            
            for slot in all_slots:
                unique_bike_slot_id = f"{bike_id}#{booking_date}#{slot}"
                try:
                    item_response = availability_table.get_item(
                        Key={'bikeId': unique_bike_slot_id}
                    )
                    if 'Item' in item_response:
                        all_availability_records.append(item_response['Item'])
                        print(f"Found record for slot {slot}: {item_response['Item'].get('status')}")
                except Exception as get_error:
                    print(f"Error getting slot {slot}: {str(get_error)}")
                    continue
            
            print(f"Found {len(all_availability_records)} availability records")
            
            # Update slot statuses based on availability records
            for record in all_availability_records:
                time_slot = convert_decimal(record.get('timeSlot'))
                status = record.get('status', '').upper()
                
                print(f"Processing slot {time_slot} with status {status}")
                
                if time_slot in slot_statuses:
                    if status == 'UNAVAILABLE':
                        slot_statuses[time_slot] = "unavailable"  # Booking requested, pending approval
                    elif status == 'RESERVED':
                        slot_statuses[time_slot] = "reserved"  # Booking confirmed
                    elif status == 'AVAILABLE':
                        slot_statuses[time_slot] = "available"  # Available for booking
                    else:
                        # For any other status, keep as available
                        slot_statuses[time_slot] = "available"
        
        except Exception as availability_error:
            print(f"Error querying availability table: {str(availability_error)}")
            # If availability table query fails, fall back to scan or checking bookings table
            try:
                # Fallback to scan if query fails (less efficient but works)
                availability_response = availability_table.scan(
                    FilterExpression='originalBikeId = :bike_id AND #date = :booking_date',
                    ExpressionAttributeNames={'#date': 'date'},
                    ExpressionAttributeValues={
                        ':bike_id': bike_id,
                        ':booking_date': booking_date
                    }
                )
                
                availability_records = availability_response.get('Items', [])
                
                # Update slot statuses based on availability records
                for record in availability_records:
                    time_slot = convert_decimal(record.get('timeSlot'))
                    status = record.get('status', '').upper()
                    
                    if time_slot in slot_statuses:
                        if status == 'UNAVAILABLE':
                            slot_statuses[time_slot] = "unavailable"
                        elif status == 'RESERVED':
                            slot_statuses[time_slot] = "reserved"
                        elif status == 'AVAILABLE':
                            slot_statuses[time_slot] = "available"
                        else:
                            slot_statuses[time_slot] = "available"
            except Exception as scan_error:
                print(f"Error scanning availability table: {str(scan_error)}")
                # If both query and scan fail, fall back to checking bookings table
                booking_response = bookings_table.scan(
                    FilterExpression='bikeId = :bike_id AND bookingDate = :booking_date',
                    ExpressionAttributeValues={
                        ':bike_id': bike_id,
                        ':booking_date': booking_date
                    }
                )
            
                bookings = booking_response.get('Items', [])
                
                # Update slot statuses based on existing bookings
                for booking in bookings:
                    slot_time = convert_decimal(booking.get('slotTime'))
                    status = booking.get('status', '').upper()
                    
                    if slot_time in slot_statuses:
                        if status in ['REQUESTED', 'PENDING_APPROVAL']:
                            slot_statuses[slot_time] = "unavailable"  # Booking pending
                        elif status == 'CONFIRMED':
                            slot_statuses[slot_time] = "reserved"  # Booking confirmed
                        elif status in ['REJECTED', 'CANCELLED']:
                            slot_statuses[slot_time] = "available"  # Available again
            except Exception as booking_error:
                print(f"Error querying bookings table: {str(booking_error)}")
                # If both fail, return default availability
        
        # Separate slots by status for easier frontend handling
        try:
            available_slots = [slot for slot, status in slot_statuses.items() if status == "available"]
            unavailable_slots = [slot for slot, status in slot_statuses.items() if status == "unavailable"]
            reserved_slots = [slot for slot, status in slot_statuses.items() if status == "reserved"]
            
            print(f"Final slot statuses: {slot_statuses}")
            
            result = {
                "bikeId": bike_id,
                "date": booking_date,
                "slotStatuses": slot_statuses,
                "availableSlots": available_slots,
                "unavailableSlots": unavailable_slots,
                "reservedSlots": reserved_slots,
                "totalSlots": len(all_slots),
                "availableCount": len(available_slots),
                "unavailableCount": len(unavailable_slots),
                "reservedCount": len(reserved_slots)
            }
            
            print(f"Returning result: {json.dumps(result)}")
            return response(200, result)
        
        except Exception as result_error:
            print(f"Error creating result: {str(result_error)}")
            return response(500, {"error": f"Error creating result: {str(result_error)}"})
        
    except KeyError as e:
        print(f"KeyError: {str(e)}")
        return response(400, {"error": f"Missing required parameter: {str(e)}"})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return response(500, {"error": f"Internal server error: {str(e)}"})

def convert_decimal(obj):
    """Convert Decimal objects to int/float for JSON serialization"""
    try:
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
    except Exception as convert_error:
        print(f"Error in convert_decimal: {str(convert_error)}")
        return str(obj)  # Return as string if conversion fails

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body if isinstance(body, dict) else {"error": body})
    }
