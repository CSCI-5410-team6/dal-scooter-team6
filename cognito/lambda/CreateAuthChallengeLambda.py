
import json
import boto3
import random
import os
import hashlib

dynamodb = boto3.client('dynamodb')
TABLE_NAME = "DALScooterUsers1" 
PHRASES = ['HELLO', 'WORLD', 'PYTHON', 'LAMBDA', 'SECURE', 'SYSTEM']

def encrypt_caesar(phrase, shift):
    """Encrypts a phrase using a Caesar cipher."""
    encrypted = ''
    for char in phrase:
        if char.isalpha():
            ascii_offset = 65 if char.isupper() else 97
            encrypted_char_code = (ord(char) - ascii_offset + shift) % 26 + ascii_offset
            encrypted += chr(encrypted_char_code)
        else:
            encrypted += char
    return encrypted

def lambda_handler(event, context):
    """
    Creates the content for the custom challenges based on the current step.
    """
    try:
        session = event.get('request', {}).get('session', [])
        response_params = event['response']
        print(f"CreateAuthChallenge event: {json.dumps(event, indent=2)}")

        # Step 1: Create the Security Question Challenge
        if len(session) == 2:
            print(f"CreateAuthChallenge session: {json.dumps(session, indent=2)}")
            username = event['request']['userAttributes']['email']
            print(f"CreateAuthChallenge username: {username}")
            db_response = dynamodb.get_item(
                TableName=TABLE_NAME,
                Key={'userId': {'S': username}}
            )
            
            print(f"CreateAuthChallenge DDB response: {json.dumps(db_response, indent=2)}")
            if 'Item' not in db_response:
                raise Exception(f"No user found for {username}")
            questions_map = db_response['Item']['questions']['M']

            questions = [
                {
                    "question": questions_map['q1']['S'],
                    "answer": questions_map['a1']['S']
                },
                {
                    "question": questions_map['q2']['S'],
                    "answer": questions_map['a2']['S']
                },
                {
                    "question": questions_map['q3']['S'],
                    "answer": questions_map['a3']['S']
                }
            ]

            
            question_data = random.choice(questions)

            print(f"CreateAuthChallenge selected question: {json.dumps(question_data, indent=2)}")
            
            answer_hash = question_data['answer']
            
            response_params['publicChallengeParameters'] = {'question': question_data['question']}
            response_params['privateChallengeParameters'] = {'answerHash': answer_hash}
            response_params['challengeMetadata'] = 'QUESTION_CHALLENGE'

        # Step 2: Create the Caesar Cipher Challenge
        elif len(session) == 3:
            phrase = random.choice(PHRASES)
            shift = random.randint(1, 5)
            clue = encrypt_caesar(phrase, shift)
            print(f"CreateAuthChallenge Caesar Cipher phrase: {phrase}, shift: {shift}, clue: {clue}")
           
            response_params['publicChallengeParameters'] = {'clue': clue, 'shift': str(shift)}
            response_params['privateChallengeParameters'] = {'answer': phrase, 'clue': clue, 'shift': str(shift)}
            response_params['challengeMetadata'] = 'CAESAR_CHALLENGE'
        
        else:
             raise Exception("Invalid state for CreateAuthChallenge")

        print(f"CreateAuthChallenge response: {json.dumps(event['response'], indent=2)}")
        return event

    except Exception as e:
        print(f"Error in CreateAuthChallenge: {str(e)}")
        event['response']['failAuthentication'] = True
        return event