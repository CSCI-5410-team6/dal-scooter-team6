import json

def lamda_handler(event, context):
    intent_name = event['currentIntent']['name']

    if intent_name == 'RegisterIntent':
        user_input = event.get('inputTranscript', '').lower()

        #Mapping user input to navigation response
        responses = {
           "register": "To register, go to the Sign-Up page, enter your email, password, and personal details, then submit the form.",
            "sign up": "To sign up, navigate to the Sign-Up page and provide your email, password, and contact information.",
            "use the app": "To use the app, start by registering on the Sign-Up page, then log in to access booking and other features.",
            "booking page": "The booking page is accessible from the main menu after logging in. Click 'Book a Bike' to start.",
            "navigate the site": "Use the main menu to access key sections: Sign-Up for registration, Login for access, or Book a Bike for reservations.",
            "create an account": "To create an account, go to the Sign-Up page and fill out the registration form with your details.",
            "book a bike": "To book a bike, log in and select 'Book a Bike' from the main menu to choose your rental options." 
        }

        #Find matching response based on keywords in user input

        response_text = "I'm here to help! Could you clarify your question about navigating the app?"
        for key, value in responses.items():
            if key in user_input:
                response_text = value
                break
        
        return {
            'dialogAction': {
                'type': 'Close',
                'fulfillmentState': 'Fulfilled',
                'message': {
                    'contentType': 'PlainText',
                    'content': response_text
                }
            }
        }
    
    return {
        'dialogAction': {
            'type': 'Close',
            'fulfillmentState': 'Failed',
            'message': {
                'contentType': 'PlainText',
                'content': 'Sorry, I could not process your request.'
            }
        }
    }