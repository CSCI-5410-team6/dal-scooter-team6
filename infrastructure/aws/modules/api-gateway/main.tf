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

data "aws_dynamodb_table" "bikes_table" {
  name = "bikes-table-${var.environment}"
}

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
          "dynamodb:Scan"
        ]
        Resource = [
          data.aws_dynamodb_table.bikes_table.arn,
        ]
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
resource "aws_api_gateway_rest_api" "this" {
  name        = "dal-scooter-team-6-api-${var.environment}"
  description = "API Gateway for dal-scooter-team-6 in ${var.environment} environment"
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_api_gateway_resource" "create_bike" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "create-bike"
}

resource "aws_api_gateway_method" "create_bike_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.create_bike.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create-bike.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_api_gateway_integration" "create_bike_post" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.create_bike.id
  http_method = aws_api_gateway_method.create_bike_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:create-bike-${var.environment}/invocations"
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "create_bike_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.create_bike.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS integration (MOCK)
resource "aws_api_gateway_integration" "create_bike_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.create_bike.id
  http_method = aws_api_gateway_method.create_bike_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

# Method response for POST
resource "aws_api_gateway_method_response" "create_bike_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.create_bike.id
  http_method = aws_api_gateway_method.create_bike_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

# Integration response for OPTIONS
resource "aws_api_gateway_integration_response" "create_bike_options_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.create_bike.id
  http_method = aws_api_gateway_method.create_bike_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  depends_on = [aws_api_gateway_integration.create_bike_options]
}

data "aws_caller_identity" "current" {}

resource "aws_api_gateway_deployment" "this" {
  depends_on = [
    aws_api_gateway_integration.create_bike_post,
    aws_api_gateway_integration.create_bike_options,
    aws_api_gateway_integration_response.create_bike_options_200
  ]
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}