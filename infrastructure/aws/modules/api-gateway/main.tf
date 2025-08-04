# Provider 
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
provider "aws" {
  region = var.region
}

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_dynamodb_table" "bikes_table" {
  name = "bikes-table-${var.environment}"
}

data "aws_dynamodb_table" "bookings_table" {
  name = "bookings-table-${var.environment}"
}

data "aws_dynamodb_table" "feedback_table" {
  name = "feedback-table-${var.environment}"
}

data "aws_dynamodb_table" "tickets_table" {
  name = "tickets-table-${var.environment}"
}

data "aws_dynamodb_table" "availability_table" {
  name = "${var.environment}-availability-table"
}

data "aws_dynamodb_table" "users_table" {
  name = "DALScooterUsers1"
}

# S3
resource "aws_s3_bucket" "bike_images" {
  bucket = "dalscooter-bike-images-${var.environment}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "bike_images" {
  bucket = aws_s3_bucket.bike_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "bike_images_policy" {
  bucket = aws_s3_bucket.bike_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.bike_images.arn}/*"
      }
    ]
  })
}

# IAM Roles and Policies
resource "aws_iam_role" "lambda_execution_role" {
  name = "DALScooterLambdaInvocationRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "DALScooterAPILambdaInvocationPolicy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan", 
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          data.aws_dynamodb_table.bikes_table.arn,
          "${data.aws_dynamodb_table.bikes_table.arn}/index/*",
          data.aws_dynamodb_table.bookings_table.arn,
          "${data.aws_dynamodb_table.bookings_table.arn}/index/*",
          data.aws_dynamodb_table.feedback_table.arn,
          "${data.aws_dynamodb_table.feedback_table.arn}/index/*",
          data.aws_dynamodb_table.tickets_table.arn,
          "${data.aws_dynamodb_table.tickets_table.arn}/index/*",
          data.aws_dynamodb_table.availability_table.arn,
          "${data.aws_dynamodb_table.availability_table.arn}/index/*",
          data.aws_dynamodb_table.users_table.arn,
          "${data.aws_dynamodb_table.users_table.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser"
        ]
        Resource = var.cognito_user_pool_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::dalscooter-bike-images-${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan"
        ]
        Resource = "arn:aws:dynamodb:${var.region}:*:table/DALScooterUsers1"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ===========================
# Lambda Functions for Bike Management
# ===========================
resource "aws_lambda_function" "create-bike" {
  filename      = "../../../../backend/lambda_functions/bikes/create_bike.py.zip"
  function_name = "create-bike-${var.environment}"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "create_bike.lambda_handler"
  runtime       = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bikes/create_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
      BIKE_IMAGES_BUCKET = aws_s3_bucket.bike_images.bucket
      AVAILABILITY_TABLE = "${var.environment}-availability-table"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "update-bike" {
  filename      = "../../../../backend/lambda_functions/bikes/update_bike.py.zip"
  function_name = "update-bike-${var.environment}"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "update_bike.lambda_handler"
  runtime       = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bikes/update_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
      BIKE_IMAGES_BUCKET = aws_s3_bucket.bike_images.bucket
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-bike" {
  filename         = "../../../../backend/lambda_functions/bikes/get_bike.py.zip"
  function_name    = "get-bike-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_bike.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bikes/get_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-all-bikes" {
  filename         = "../../../../backend/lambda_functions/bikes/get_all_bikes.py.zip"
  function_name    = "get-all-bikes-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_all_bikes.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bikes/get_all_bikes.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}
resource "aws_lambda_function" "delete-bike" {
  filename         = "../../../../backend/lambda_functions/bikes/delete_bike.py.zip"
  function_name    = "delete-bike-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "delete_bike.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bikes/delete_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

# Lambda Functions for Booking/Availability
resource "aws_lambda_function" "get-availability" {
  filename         = "../../../../backend/lambda_functions/availability/get_availability.py.zip"
  function_name    = "getAvailabilityLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/availability/get_availability.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}",
      AVAILABILITY_TABLE = "${var.environment}-availability-table"
    }
  }
  tags = local.common_tags
}
resource "aws_lambda_function" "update-availability" {
  filename         = "../../../../backend/lambda_functions/availability/update_availability.py.zip"
  function_name    = "update-availability-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "update_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/availability/update_availability.py.zip")
  environment {
    variables = {
      AVAILABILITY_TABLE = "${var.environment}-availability-table"
    }
  }
  tags = local.common_tags
}

# Lambda Functions for Booking Bike

resource "aws_lambda_function" "create-booking" {
  filename         = "../../../../backend/lambda_functions/bookings/create_booking.py.zip"
  function_name    = "createBookingLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "create_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/create_booking.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE                = "bookings-table-${var.environment}"
      AVAILABILITY_TABLE            = "${var.environment}-availability-table"
      SNS_TOPIC_ARN                = var.sns_topic_arn
      BOOKING_REQUESTS_QUEUE_URL   = var.booking_requests_queue_url
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-booking" {
  filename         = "../../../../backend/lambda_functions/bookings/get_booking.py.zip"
  function_name    = "getBookingLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/get_booking.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-all-bookings" {
  filename         = "../../../../backend/lambda_functions/bookings/get_all_bookings.py.zip"
  function_name    = "get-all-bookings-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_all_bookings.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/get_all_bookings.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-user-bookings" {
  filename         = "../../../../backend/lambda_functions/bookings/get_user_bookings.py.zip"
  function_name    = "get-user-bookings-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_user_bookings.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/get_user_bookings.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}",
      BIKES_TABLE = "bikes-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

# Lambda Function for Booking Assigner (SQS Processing)
resource "aws_lambda_function" "booking-assigner" {
  filename         = "../../../../backend/lambda_functions/bookings/booking_assigner.py.zip"
  function_name    = "booking-assigner-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "booking_assigner.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/booking_assigner.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
      USERS_TABLE    = "DALScooterUsers1"
      BIKES_TABLE    = "bikes-table-${var.environment}"
      SNS_TOPIC_ARN  = var.sns_topic_arn
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    }
  }
  tags = local.common_tags
}

# Lambda Function for Booking Approval
resource "aws_lambda_function" "approve-booking" {
  filename         = "../../../../backend/lambda_functions/bookings/approve_booking.py.zip"
  function_name    = "approve-booking-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "approve_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/bookings/approve_booking.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
      AVAILABILITY_TABLE = "${var.environment}-availability-table"
      SNS_TOPIC_ARN  = var.sns_topic_arn
    }
  }
  tags = local.common_tags
}

# SQS Event Source Mapping for Booking Assigner
resource "aws_lambda_event_source_mapping" "booking_request_mapping" {
  event_source_arn = var.booking_requests_queue_arn
  function_name    = aws_lambda_function.booking-assigner.arn
  batch_size       = 1
}

# Lambda Functions for feedback
resource "aws_lambda_function" "submit-feedback" {
  filename         = "../../../../backend/lambda_functions/feedback/submit_feedback.py.zip"
  function_name    = "submitFeedbackLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "submit_feedback.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/feedback/submit_feedback.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}",
      FEEDBACK_TABLE = "feedback-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-bike-feedback" {
  filename         = "../../../../backend/lambda_functions/feedback/get_feedback_by_bike.py.zip"
  function_name    = "getBikeFeedbackLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_feedback_by_bike.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/feedback/get_feedback_by_bike.py.zip")
  environment {
    variables = {
      FEEDBACK_TABLE = "feedback-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-franchise-feedback" {
  filename         = "../../../../backend/lambda_functions/feedback/get_franchise_feedback.py.zip"
  function_name    = "getFranchiseFeedbackLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_franchise_feedback.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/feedback/get_franchise_feedback.py.zip")
  environment {
    variables = {
      FEEDBACK_TABLE = "feedback-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "update-feedback" {
  filename         = "../../../../backend/lambda_functions/feedback/update_feedback.py.zip"
  function_name    = "update-feedback-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "update_feedback.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/feedback/update_feedback.py.zip")
  environment {
    variables = {
      FEEDBACK_TABLE = "feedback-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

# Lambda Functions for Ticket Management
resource "aws_lambda_function" "create-ticket" {
  filename         = "../../../../backend/lambda_functions/tickets/create_ticket.py.zip"
  function_name    = "create-ticket-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "create_ticket.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/tickets/create_ticket.py.zip")
  environment {
    variables = {
      TICKET_TABLE = "ticket-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-all-tickets" {
  filename         = "../../../../backend/lambda_functions/tickets/get_all_tickets.py.zip"
  function_name    = "get-all-tickets-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_all_tickets.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/tickets/get_all_tickets.py.zip")
  environment {
    variables = {
      TICKET_TABLE = "ticket-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-user-tickets" {
  filename         = "../../../../backend/lambda_functions/tickets/get_user_tickets.py.zip"
  function_name    = "get-user-tickets-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_user_tickets.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/tickets/get_user_tickets.py.zip")
  environment {
    variables = {
      TICKET_TABLE = "ticket-table-${var.environment}",
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-ticket-by-id" {
  filename         = "../../../../backend/lambda_functions/tickets/get_ticket_by_id.py.zip"
  function_name    = "get-ticket-by-id-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_ticket_by_id.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/tickets/get_ticket_by_id.py.zip")
  environment {
    variables = {
      TICKET_TABLE = "ticket-table-${var.environment}",
    }
  }
  tags = local.common_tags
}
# --- API Gateway ---
resource "aws_api_gateway_rest_api" "this" {
  name        = "dal-scooter-team-6-api-${var.environment}"
  description = "API Gateway for dal-scooter-team-6 in ${var.environment} environment"
  tags = local.common_tags
}

# ===========================
# /bikes (POST) Endpoint
# ===========================
resource "aws_api_gateway_resource" "bikes" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "bikes"
}

resource "aws_api_gateway_method" "bikes_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "bikes_post" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:create-bike-${var.environment}/invocations"
}

resource "aws_lambda_permission" "bikes_post" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create-bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# CORS for /bikes
# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "bikes_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS integration (MOCK)
resource "aws_api_gateway_integration" "bikes_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

# Method response for POST
resource "aws_api_gateway_method_response" "bikes_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

# Integration response for OPTIONS
resource "aws_api_gateway_integration_response" "bikes_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.bikes_options]
}

# ===========================
# /bikes/{bikeId} (PUT) Endpoint
# ===========================

resource "aws_api_gateway_resource" "bike_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.bikes.id
  path_part   = "{bikeId}"
}

resource "aws_api_gateway_method" "bike_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "PUT"
  request_parameters = {
    "method.request.path.bikeId" = true
  }
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Lambda integration for PUT
resource "aws_api_gateway_integration" "bike_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.bike_id.id
  http_method             = aws_api_gateway_method.bike_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:update-bike-${var.environment}/invocations"
}

# Lambda permission for API Gateway to invoke
resource "aws_lambda_permission" "bike_id_put" {
  statement_id  = "AllowAPIGatewayInvokeUpdateBike"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update-bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/PUT/bikes/*"
}

# CORS OPTIONS for /bikes/{bikeId}
resource "aws_api_gateway_method" "update_bike_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_bike_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.update_bike_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "update_bike_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.update_bike_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "update_bike_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.update_bike_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,DELETE,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.update_bike_options]
}
# ===========================
# /bikes/{bikeId} (GET) Endpoint
# ===========================

# GET method for /bikes/{bikeId}
resource "aws_api_gateway_method" "bike_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "GET"
  authorization = "NONE" # Or "COGNITO_USER_POOLS" if you want to protect it
  request_parameters = {
    "method.request.path.bikeId" = true
  }
}

resource "aws_api_gateway_integration" "bike_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.bike_id.id
  http_method             = aws_api_gateway_method.bike_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-bike-${var.environment}/invocations"
}

resource "aws_lambda_permission" "bike_id_get" {
  statement_id  = "AllowAPIGatewayInvokeGetBike"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/bikes/*"
}
# ===========================
# /bikes/{bikeId} (DELETE) Endpoint
# ===========================
resource "aws_api_gateway_method" "bike_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.bikeId" = true
  }
}

resource "aws_api_gateway_integration" "bike_id_delete" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.bike_id.id
  http_method             = aws_api_gateway_method.bike_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:delete-bike-${var.environment}/invocations"
}

resource "aws_lambda_permission" "bike_id_delete" {
  statement_id  = "AllowAPIGatewayInvokeDeleteBike"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete-bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/DELETE/bikes/*"
}

# ===========================
# /bikes (GET all bikes) Endpoint
# ===========================
# GET method for /bikes
resource "aws_api_gateway_method" "bikes_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "GET"
  authorization = "NONE" # Or "COGNITO_USER_POOLS" if you want to protect it
}

resource "aws_api_gateway_integration" "bikes_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.bikes.id
  http_method             = aws_api_gateway_method.bikes_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-all-bikes-${var.environment}/invocations"
}

resource "aws_lambda_permission" "bikes_get" {
  statement_id  = "AllowAPIGatewayInvokeGetAllBikes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-all-bikes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/bikes"
}

resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "CognitoAuthorizer"
  rest_api_id            = aws_api_gateway_rest_api.this.id
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [var.cognito_user_pool_arn] // Reference your Cognito user pool
  identity_source        = "method.request.header.Authorization"
}

# ===========================
# /availability/{bikeId} (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "availability" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "availability"
}

resource "aws_api_gateway_resource" "availability_bike_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.availability.id
  path_part   = "{bikeId}"
}

resource "aws_api_gateway_method" "availability_bike_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.availability_bike_id.id
  http_method   = "GET"
  authorization = "NONE" # Public endpoint
  request_parameters = {
    "method.request.path.bikeId"       = true
    "method.request.querystring.date"  = false # Optional query parameter
  }
}

resource "aws_api_gateway_integration" "availability_bike_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.availability_bike_id.id
  http_method             = aws_api_gateway_method.availability_bike_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:getAvailabilityLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "availability_bike_id_get" {
  statement_id  = "AllowAPIGatewayInvokeGetAvailability"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-availability.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/availability/*"
}

# CORS for /availability/{bikeId}
resource "aws_api_gateway_method" "availability_bike_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.availability_bike_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "availability_bike_id_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.availability_bike_id.id
  http_method = aws_api_gateway_method.availability_bike_id_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "availability_bike_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.availability_bike_id.id
  http_method = aws_api_gateway_method.availability_bike_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "availability_bike_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.availability_bike_id.id
  http_method = aws_api_gateway_method.availability_bike_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.availability_bike_id_options]
}

# ===========================
# /availability/{bikeId} (PUT) Endpoint
# ===========================

resource "aws_api_gateway_method" "availability_bike_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.availability_bike_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.bikeId" = true
  }
}

resource "aws_api_gateway_integration" "availability_bike_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.availability_bike_id.id
  http_method             = aws_api_gateway_method.availability_bike_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:update-availability-${var.environment}/invocations"
}

resource "aws_lambda_permission" "availability_bike_id_put" {
  statement_id  = "AllowAPIGatewayInvokeUpdateAvailability"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update-availability.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/PUT/availability/*"
}

# ===========================
# /booking (POST) Endpoint
# ===========================

resource "aws_api_gateway_resource" "booking" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "booking"
}

resource "aws_api_gateway_method" "booking_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "booking_post" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.booking.id
  http_method             = aws_api_gateway_method.booking_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:createBookingLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "booking_post" {
  statement_id  = "AllowAPIGatewayInvokeCreateBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create-booking.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/POST/booking"
}

# CORS for /booking
resource "aws_api_gateway_method" "booking_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "booking_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking.id
  http_method = aws_api_gateway_method.booking_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "booking_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking.id
  http_method = aws_api_gateway_method.booking_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "booking_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking.id
  http_method = aws_api_gateway_method.booking_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.booking_options]
}

# ===========================
# /booking/{referenceCode} (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "booking_reference_code" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.booking.id
  path_part   = "{referenceCode}"
}

resource "aws_api_gateway_method" "booking_reference_code_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_reference_code.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.referenceCode" = true
  }
}

resource "aws_api_gateway_integration" "booking_reference_code_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.booking_reference_code.id
  http_method             = aws_api_gateway_method.booking_reference_code_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:getBookingLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "booking_reference_code_get" {
  statement_id  = "AllowAPIGatewayInvokeGetBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-booking.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/booking/*"
}

# CORS for /booking/{referenceCode}
resource "aws_api_gateway_method" "booking_reference_code_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_reference_code.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "booking_reference_code_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_reference_code.id
  http_method = aws_api_gateway_method.booking_reference_code_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "booking_reference_code_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_reference_code.id
  http_method = aws_api_gateway_method.booking_reference_code_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "booking_reference_code_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_reference_code.id
  http_method = aws_api_gateway_method.booking_reference_code_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.booking_reference_code_options]
}

# ===========================
# /booking/admin (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "booking_admin" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.booking.id
  path_part   = "admin"
}

resource "aws_api_gateway_method" "booking_admin_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_admin.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "booking_admin_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.booking_admin.id
  http_method             = aws_api_gateway_method.booking_admin_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-all-bookings-${var.environment}/invocations"
}

resource "aws_lambda_permission" "booking_admin_get" {
  statement_id  = "AllowAPIGatewayInvokeGetAllBookings"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-all-bookings.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/booking/admin"
}

# CORS for /booking/admin
resource "aws_api_gateway_method" "booking_admin_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_admin.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "booking_admin_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_admin.id
  http_method = aws_api_gateway_method.booking_admin_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "booking_admin_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_admin.id
  http_method = aws_api_gateway_method.booking_admin_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "booking_admin_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_admin.id
  http_method = aws_api_gateway_method.booking_admin_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.booking_admin_options]
}

# ===========================
# /booking/user (GET, OPTIONS) Endpoint
# ===========================

resource "aws_api_gateway_resource" "booking_user" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.booking.id
  path_part   = "user"
}

resource "aws_api_gateway_method" "booking_user_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_user.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "booking_user_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.booking_user.id
  http_method             = aws_api_gateway_method.booking_user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-user-bookings-${var.environment}/invocations"
}

resource "aws_lambda_permission" "booking_user_get" {
  statement_id  = "AllowAPIGatewayInvokeGetUserBookings"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-user-bookings.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/booking/user"
}

# CORS for /booking/user
resource "aws_api_gateway_method" "booking_user_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_user.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "booking_user_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_user.id
  http_method = aws_api_gateway_method.booking_user_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "booking_user_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_user.id
  http_method = aws_api_gateway_method.booking_user_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "booking_user_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.booking_user.id
  http_method = aws_api_gateway_method.booking_user_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.booking_user_options]
}

# ===========================
# /booking/{referenceCode} (PUT) Endpoint for Approval
# ===========================

resource "aws_api_gateway_method" "booking_reference_code_put" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.booking_reference_code.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.referenceCode" = true
  }
}

resource "aws_api_gateway_integration" "booking_reference_code_put" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.booking_reference_code.id
  http_method             = aws_api_gateway_method.booking_reference_code_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:approve-booking-${var.environment}/invocations"
}

resource "aws_lambda_permission" "booking_reference_code_put" {
  statement_id  = "AllowAPIGatewayInvokeApproveBooking"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.approve-booking.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/PUT/booking/*"
}

# ===========================
# /feedback (POST) Endpoint
# ===========================

resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "feedback"
}

resource "aws_api_gateway_method" "feedback_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "feedback_post" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.feedback_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:submitFeedbackLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "feedback_post" {
  statement_id  = "AllowAPIGatewayInvokeSubmitFeedback"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit-feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/POST/feedback"
}

# CORS for /feedback
resource "aws_api_gateway_method" "feedback_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "feedback_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.feedback_options]
}

# ===========================
# /feedback/bike/{bikeId} (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "feedback_bike" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.feedback.id
  path_part   = "bike"
}

resource "aws_api_gateway_resource" "feedback_bike_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.feedback_bike.id
  path_part   = "{bikeId}"
}

resource "aws_api_gateway_method" "feedback_bike_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_bike_id.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.path.bikeId" = true
  }
}

resource "aws_api_gateway_integration" "feedback_bike_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.feedback_bike_id.id
  http_method             = aws_api_gateway_method.feedback_bike_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:getBikeFeedbackLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "feedback_bike_id_get" {
  statement_id  = "AllowAPIGatewayInvokeGetBikeFeedback"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-bike-feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/feedback/bike/*"
}

# CORS for /feedback/bike/{bikeId}
resource "aws_api_gateway_method" "feedback_bike_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_bike_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_bike_id_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_bike_id.id
  http_method = aws_api_gateway_method.feedback_bike_id_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "feedback_bike_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_bike_id.id
  http_method = aws_api_gateway_method.feedback_bike_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_bike_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_bike_id.id
  http_method = aws_api_gateway_method.feedback_bike_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.feedback_bike_id_options]
}

# ===========================
# /feedback/franchise/{franchiseId} (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "feedback_franchise" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.feedback.id
  path_part   = "franchise"
}

resource "aws_api_gateway_resource" "feedback_franchise_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.feedback_franchise.id
  path_part   = "{franchiseId}"
}

resource "aws_api_gateway_method" "feedback_franchise_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_franchise_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.franchiseId" = true
  }
}

resource "aws_api_gateway_integration" "feedback_franchise_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.feedback_franchise_id.id
  http_method             = aws_api_gateway_method.feedback_franchise_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:getFranchiseFeedbackLambda-${var.environment}/invocations"
}

resource "aws_lambda_permission" "feedback_franchise_id_get" {
  statement_id  = "AllowAPIGatewayInvokeGetFranchiseFeedback"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-franchise-feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/feedback/franchise/*"
}

# CORS for /feedback/franchise/{franchiseId}
resource "aws_api_gateway_method" "feedback_franchise_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_franchise_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_franchise_id_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_franchise_id.id
  http_method = aws_api_gateway_method.feedback_franchise_id_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "feedback_franchise_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_franchise_id.id
  http_method = aws_api_gateway_method.feedback_franchise_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_franchise_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_franchise_id.id
  http_method = aws_api_gateway_method.feedback_franchise_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.feedback_franchise_id_options]
}

# ===========================
# /feedback/{feedback-id} (PUT) Endpoint
# ===========================

resource "aws_api_gateway_resource" "feedback_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.feedback.id
  path_part   = "{feedback-id}"
}

resource "aws_api_gateway_method" "feedback_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.feedback-id" = true
  }
}

resource "aws_api_gateway_integration" "feedback_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.feedback_id.id
  http_method             = aws_api_gateway_method.feedback_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:update-feedback-${var.environment}/invocations"
}

resource "aws_lambda_permission" "feedback_id_put" {
  statement_id  = "AllowAPIGatewayInvokeUpdateFeedback"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update-feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/PUT/feedback/*"
}

# CORS for /feedback/{feedback-id}
resource "aws_api_gateway_method" "feedback_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.feedback_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_id_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_id.id
  http_method = aws_api_gateway_method.feedback_id_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "feedback_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_id.id
  http_method = aws_api_gateway_method.feedback_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.feedback_id.id
  http_method = aws_api_gateway_method.feedback_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.feedback_id_options]
}

# ===========================
# /tickets (POST) Endpoint
# ===========================

resource "aws_api_gateway_resource" "tickets" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "tickets"
}

resource "aws_api_gateway_method" "tickets_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "tickets_post" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.tickets.id
  http_method             = aws_api_gateway_method.tickets_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:create-ticket-${var.environment}/invocations"
}

resource "aws_lambda_permission" "tickets_post" {
  statement_id  = "AllowAPIGatewayInvokeCreateTicket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create-ticket.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/POST/tickets"
}

# CORS for /tickets
resource "aws_api_gateway_method" "tickets_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tickets_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets.id
  http_method = aws_api_gateway_method.tickets_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "tickets_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets.id
  http_method = aws_api_gateway_method.tickets_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "tickets_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets.id
  http_method = aws_api_gateway_method.tickets_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.tickets_options]
}

# ===========================
# /tickets/admin (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "tickets_admin" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.tickets.id
  path_part   = "admin"
}

resource "aws_api_gateway_method" "tickets_admin_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_admin.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "tickets_admin_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.tickets_admin.id
  http_method             = aws_api_gateway_method.tickets_admin_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-all-tickets-${var.environment}/invocations"
}

resource "aws_lambda_permission" "tickets_admin_get" {
  statement_id  = "AllowAPIGatewayInvokeGetAllTickets"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-all-tickets.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/tickets/admin"
}

# CORS for /tickets/admin
resource "aws_api_gateway_method" "tickets_admin_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_admin.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tickets_admin_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_admin.id
  http_method = aws_api_gateway_method.tickets_admin_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "tickets_admin_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_admin.id
  http_method = aws_api_gateway_method.tickets_admin_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "tickets_admin_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_admin.id
  http_method = aws_api_gateway_method.tickets_admin_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.tickets_admin_options]
}

# ===========================
# /tickets/user (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "tickets_user" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.tickets.id
  path_part   = "user"
}

resource "aws_api_gateway_method" "tickets_user_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_user.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "tickets_user_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.tickets_user.id
  http_method             = aws_api_gateway_method.tickets_user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-user-tickets-${var.environment}/invocations"
}

resource "aws_lambda_permission" "tickets_user_get" {
  statement_id  = "AllowAPIGatewayInvokeGetUserTickets"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-user-tickets.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/tickets/user"
}

# CORS for /tickets/user
resource "aws_api_gateway_method" "tickets_user_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_user.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tickets_user_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_user.id
  http_method = aws_api_gateway_method.tickets_user_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "tickets_user_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_user.id
  http_method = aws_api_gateway_method.tickets_user_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "tickets_user_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_user.id
  http_method = aws_api_gateway_method.tickets_user_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.tickets_user_options]
}

# ===========================
# /tickets/{ticketId} (GET) Endpoint
# ===========================

resource "aws_api_gateway_resource" "tickets_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.tickets.id
  path_part   = "{ticketId}"
}

resource "aws_api_gateway_method" "tickets_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  request_parameters = {
    "method.request.path.ticketId" = true
  }
}

resource "aws_api_gateway_integration" "tickets_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.tickets_id.id
  http_method             = aws_api_gateway_method.tickets_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:get-ticket-by-id-${var.environment}/invocations"
}

resource "aws_lambda_permission" "tickets_id_get" {
  statement_id  = "AllowAPIGatewayInvokeGetTicketById"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-ticket-by-id.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/GET/tickets/*"
}

# CORS for /tickets/{ticketId}
resource "aws_api_gateway_method" "tickets_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.tickets_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tickets_id_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_id.id
  http_method = aws_api_gateway_method.tickets_id_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "tickets_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_id.id
  http_method = aws_api_gateway_method.tickets_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "tickets_id_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.tickets_id.id
  http_method = aws_api_gateway_method.tickets_id_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.tickets_id_options]
}

# --- Deployment ---
resource "aws_api_gateway_deployment" "this" {
  depends_on = [
    # Bike endpoints
    aws_api_gateway_integration.bikes_post,
    aws_api_gateway_integration.bikes_get,
    aws_api_gateway_integration.bikes_options,
    aws_api_gateway_integration_response.bikes_options_200,
    
    aws_api_gateway_integration.bike_id_put,
    aws_api_gateway_integration.bike_id_get,
    aws_api_gateway_integration.bike_id_delete,
    aws_api_gateway_integration.update_bike_options,
    aws_api_gateway_integration_response.update_bike_options_200,
    
    # Availability endpoints
    aws_api_gateway_integration.availability_bike_id_get,
    aws_api_gateway_integration.availability_bike_id_put,
    aws_api_gateway_integration.availability_bike_id_options,
    aws_api_gateway_integration_response.availability_bike_id_options_200,
    
    # Booking endpoints
    aws_api_gateway_integration.booking_post,
    aws_api_gateway_integration.booking_options,
    aws_api_gateway_integration_response.booking_options_200,
    
    aws_api_gateway_integration.booking_reference_code_get,
    aws_api_gateway_integration.booking_reference_code_options,
    aws_api_gateway_integration_response.booking_reference_code_options_200,
    
    aws_api_gateway_integration.booking_admin_get,
    aws_api_gateway_integration.booking_admin_options,
    aws_api_gateway_integration_response.booking_admin_options_200,
    
    aws_api_gateway_integration.booking_user_get,
    aws_api_gateway_integration.booking_user_options,
    aws_api_gateway_integration_response.booking_user_options_200,
    
    # Booking approval endpoints
    aws_api_gateway_integration.booking_reference_code_put,
    
    # Feedback endpoints
    aws_api_gateway_integration.feedback_post,
    aws_api_gateway_integration.feedback_options,
    aws_api_gateway_integration_response.feedback_options_200,
    
    aws_api_gateway_integration.feedback_bike_id_get,
    aws_api_gateway_integration.feedback_bike_id_options,
    aws_api_gateway_integration_response.feedback_bike_id_options_200,
    
    aws_api_gateway_integration.feedback_franchise_id_get,
    aws_api_gateway_integration.feedback_franchise_id_options,
    aws_api_gateway_integration_response.feedback_franchise_id_options_200,
    
    aws_api_gateway_integration.feedback_id_put,
    aws_api_gateway_integration.feedback_id_options,
    aws_api_gateway_integration_response.feedback_id_options_200,
    
    # Ticket endpoints
    aws_api_gateway_integration.tickets_post,
    aws_api_gateway_integration.tickets_options,
    aws_api_gateway_integration_response.tickets_options_200,
    
    aws_api_gateway_integration.tickets_admin_get,
    aws_api_gateway_integration.tickets_admin_options,
    aws_api_gateway_integration_response.tickets_admin_options_200,
    
    aws_api_gateway_integration.tickets_user_get,
    aws_api_gateway_integration.tickets_user_options,
    aws_api_gateway_integration_response.tickets_user_options_200,
    
    aws_api_gateway_integration.tickets_id_get,
    aws_api_gateway_integration.tickets_id_options,
    aws_api_gateway_integration_response.tickets_id_options_200,
  ]
  rest_api_id = aws_api_gateway_rest_api.this.id

  lifecycle {
    create_before_destroy = true
  }
}

# Add this after your deployment resource
resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.environment
}