import json

def lambda_handler(event, context):
    # Extract intent name and user input from Lex V2 event structure
    intent_name = event.get('sessionState', {}).get('intent', {}).get('name')
    user_input = event.get('inputTranscript', '').lower()

    if intent_name == 'RegisterIntent':
        # Define responses for different types of input
        greeting_keywords = ["hi", "hello", "hey", "greetings"]
        responses = {
            "register": "To register, go to the Sign-Up page, enter your email, password, and personal details, then submit the form.",
            "sign up": "To sign up, navigate to the Sign-Up page and provide your email, password, and contact information.",
            "use the app": "To use the app, start by registering on the Sign-Up page, then log in to access booking and other features.",
            "booking page": "The booking page is accessible from the main menu after logging in. Click 'Book a Bike' to start.",
            "navigate the site": "Use the main menu to access key sections: Sign-Up for registration, Login for access, or Book a Bike for reservations.",
            "create an account": "To create an account, go to the Sign-Up page and fill out the registration form with your details.",
            "book a bike": "To book a bike, log in and select 'Book a Bike' from the main menu to choose your rental options."
        }

        # Handle greeting inputs
        if any(keyword in user_input for keyword in greeting_keywords):
            capabilities = [
                "Register for an account",
                "Learn how to use the app",
                "Find the booking page",
                "Get help navigating the site",
                "Book a bike"
            ]
            response_text = f"Hello! Welcome to Dal Scooter, I can help you with: {', '.join(capabilities)}. How can I assist you today?"
        
        # Handle registration-related queries
        else:
            response_text = "I'm here to help! Could you clarify your question about navigating the app?"
            for key, value in responses.items():
                if key in user_input:
                    response_text = value
                    break

        return {
            'sessionState': {
                'dialogAction': {
                    'type': 'Close'
                },
                'intent': {
                    'name': 'RegisterIntent',
                    'state': 'Fulfilled'
                }
            },
            'messages': [
                {
                    'contentType': 'PlainText',
                    'content': response_text
                }
            ],
            'responseContentType': 'application/json'
        }
    
    # Default case for unexpected intents (should not occur with single intent setup)
    example_questions = [
        "How do I register?",
        "How to sign up?",
        "Where is the booking page?",
        "How to use the app?",
        "How do I book a bike?"
    ]
    response_text = f"Sorry, I could not process your request. You can try asking: {', '.join(example_questions)}."
    
    return {
        'sessionState': {
            'dialogAction': {
                'type': 'Close'
            },
            'intent': {
                'name': intent_name,
                'state': 'Failed'
            }
        },
        'messages': [
            {
                'contentType': 'PlainText',
                'content': response_text
            }
        ],
        'responseContentType': 'application/json'
    }