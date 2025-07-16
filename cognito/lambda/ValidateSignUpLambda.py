
import json
import boto3
import datetime
from botocore.exceptions import ClientError

dynamodb_client = boto3.client('dynamodb', region_name='ca-central-1')

def caesar_cipher_decrypt(text, shift):
    """Decrypt a Caesar cipher text with the given shift."""
    if text is None:
        raise ValueError("cipherChallenge is missing or null.")
    
    decrypted = ''
    for char in text.upper():
        if char.isalpha():
            code = ord(char) - 65
            shifted = (code - shift) % 26
            decrypted += chr(shifted + 65)
        else:
            decrypted += char
    return decrypted
 
def lambda_handler(event, context):
    try:
        # Extract user attributes
        user_attributes = event['request']['userAttributes']
        email = user_attributes.get('email')
        if not email:
            raise ValueError("Missing email in userAttributes")

        client_metadata = event['request'].get('clientMetadata', {})
        if not client_metadata:
            raise ValueError("Missing clientMetadata in request")

        # Parse and validate cipherData
        cipher_data_raw = client_metadata.get('cipherData')
        if not cipher_data_raw:
            raise ValueError("Missing cipherData in clientMetadata")

        try:
            cipher_data = json.loads(cipher_data_raw)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in cipherData")

        cipher_challenge = cipher_data.get('cipherChallenge')
        cipher_response = cipher_data.get('cipherResponse')
        cipher_key_raw = cipher_data.get('cipherKey')

        if not cipher_challenge or not cipher_response or cipher_key_raw is None:
            raise ValueError("Missing one or more cipher values")

        try:
            cipher_key = int(cipher_key_raw)
        except (TypeError, ValueError):
            raise ValueError(f"Invalid cipherKey: {cipher_key_raw}")

        print(f"Parsed cipherData: challenge={cipher_challenge}, key={cipher_key}, response={cipher_response}")

        # Parse and validate questions
        questions_raw = client_metadata.get('questions')
        if not questions_raw:
            raise ValueError("Missing questions in clientMetadata")

        try:
            questions = json.loads(questions_raw)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in questions")

        print(f"Parsed questions: {questions}")

        # Get user type
        user_type = client_metadata.get('userType', 'unknown')

        # Caesar cipher validation
        decrypted = caesar_cipher_decrypt(cipher_challenge, cipher_key)
        if decrypted != cipher_response:
            raise Exception("Invalid Caesar cipher response")

        # Write to DynamoDB
        dynamodb_client.put_item(
            TableName='DALScooterUsers1',
            Item={
                'userId': {'S': email},
                'email': {'S': email},
                'userType': {'S': user_type},
                'questions': {
                    'M': {
                        'q1': {'S': questions.get('q1', '')},
                        'a1': {'S': questions.get('a1', '')},
                        'q2': {'S': questions.get('q2', '')},
                        'a2': {'S': questions.get('a2', '')},
                        'q3': {'S': questions.get('q3', '')},
                        'a3': {'S': questions.get('a3', '')}
                    }
                },
                'createdAt': {'S': datetime.datetime.utcnow().isoformat()}
            }
        )

        print("User validation and data storage succeeded.")
        return event

    except Exception as e:
        print(f"Error: {str(e)}")
        raise Exception(f"Pre Sign-up validation failed: {str(e)}")
