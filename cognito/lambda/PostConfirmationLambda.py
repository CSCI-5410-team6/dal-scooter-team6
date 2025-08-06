import json
import boto3
import os

sns_client = boto3.client('sns', region_name='ca-central-1')
cognito_client = boto3.client('cognito-idp')

def lambda_handler(event, context):
    try:
        user_attributes = event['request']['userAttributes']
        email = user_attributes.get('email')
        username = event['userName']
        user_pool_id = event['userPoolId']

        # Get userType from userAttributes (adjust if you store elsewhere)
        user_type = user_attributes.get('custom:userType') or user_attributes.get('userType')

        # Decide the group based on userType
        if user_type == 'franchise_operator':
            group_name = "FranchiseOperators"
        else:
            # Default group
            group_name = "Customers"

        # Add user to the group dynamically
        cognito_client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=username,
            GroupName=group_name
        )

        # Send welcome notification
        sns_client.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Message=f"Welcome to DALScooter, {email}! Your registration is complete.",
            MessageAttributes={
                'email': {
                    'DataType': 'String',
                    'StringValue': email
                }
            }
        )

        return event

    except Exception as e:
        print(f"Error in PostConfirmation Lambda: {str(e)}")
        raise e
