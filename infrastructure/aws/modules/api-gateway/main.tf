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
          data.aws_dynamodb_table.bookings_table.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::dalscooter-bike-images-${var.environment}/*"
        ]
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

#Lambda Functions
resource "aws_lambda_function" "create-bike" {
  filename      = "../../../../backend/lambda_functions/create_bike.py.zip"
  function_name = "create-bike-${var.environment}"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "create_bike.lambda_handler"
  runtime       = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/create_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
      BIKE_IMAGES_BUCKET = aws_s3_bucket.bike_images.bucket
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "update-bike" {
  filename      = "../../../../backend/lambda_functions/update_bike.py.zip"
  function_name = "update-bike-${var.environment}"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "update_bike.lambda_handler"
  runtime       = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/update_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
      BIKE_IMAGES_BUCKET = aws_s3_bucket.bike_images.bucket
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-bike" {
  filename         = "../../../../backend/lambda_functions/get_bike.py.zip"
  function_name    = "get-bike-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_bike.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/get_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-all-bikes" {
  filename         = "../../../../backend/lambda_functions/get_all_bikes.py.zip"
  function_name    = "get-all-bikes-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_all_bikes.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/get_all_bikes.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}
resource "aws_lambda_function" "delete-bike" {
  filename         = "../../../../backend/lambda_functions/delete_bike.py.zip"
  function_name    = "delete-bike-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "delete_bike.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/delete_bike.py.zip")
  environment {
    variables = {
      BIKES_TABLE = "bikes-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

# Lambda Functions for Booking/Availability
resource "aws_lambda_function" "get-availability" {
  filename         = "../../../../backend/lambda_functions/get_availability.py.zip"
  function_name    = "getAvailabilityLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/get_availability.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "create-booking" {
  filename         = "../../../../backend/lambda_functions/create_booking.py.zip"
  function_name    = "createBookingLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "create_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/create_booking.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
      SNS_TOPIC_ARN  = var.sns_topic_arn
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "get-booking" {
  filename         = "../../../../backend/lambda_functions/get_booking.py.zip"
  function_name    = "getBookingLambda-${var.environment}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "get_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../backend/lambda_functions/get_booking.py.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = "bookings-table-${var.environment}"
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
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,OPTIONS'"
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
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.availability_bike_id_options]
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
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.booking_reference_code_options]
}

# --- Deployment ---
resource "aws_api_gateway_deployment" "this" {
  depends_on = [
    # Existing bike endpoints
    aws_api_gateway_integration.bikes_post,
    aws_api_gateway_integration.bikes_get,
    aws_api_gateway_integration.bikes_options,
    aws_api_gateway_integration_response.bikes_options_200,
    
    aws_api_gateway_integration.bike_id_put,
    aws_api_gateway_integration.bike_id_get,
    aws_api_gateway_integration.bike_id_delete,
    aws_api_gateway_integration.update_bike_options,
    aws_api_gateway_integration_response.update_bike_options_200,
    
    # New booking/availability endpoints
    aws_api_gateway_integration.availability_bike_id_get,
    aws_api_gateway_integration.availability_bike_id_options,
    aws_api_gateway_integration_response.availability_bike_id_options_200,
    
    aws_api_gateway_integration.booking_post,
    aws_api_gateway_integration.booking_options,
    aws_api_gateway_integration_response.booking_options_200,
    
    aws_api_gateway_integration.booking_reference_code_get,
    aws_api_gateway_integration.booking_reference_code_options,
    aws_api_gateway_integration_response.booking_reference_code_options_200,
  ]
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}