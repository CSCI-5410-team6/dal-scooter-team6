import json
import boto3
import os
from botocore.exceptions import ClientError

sns_client = boto3.client('sns', region_name='ca-central-1')

def lambda_handler(event, context):
    try:
        email = event['request']['userAttributes']['email']
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

    except ClientError as e:
        print(f"Error: {str(e)}")
        raise e