terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.9.0"
    }
  }
}

data "aws_lambda_function" "fulfillment" {
  function_name = var.lambda_function_name
}

resource "aws_api_gateway_rest_api" "this" {
  name        = var.api_name
  description = "Chatbot API (${var.environment})"
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}

resource "aws_api_gateway_resource" "root" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "chatbot"
}

### PUBLIC
resource "aws_api_gateway_resource" "public" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.root.id
  path_part   = "public"
}

resource "aws_api_gateway_method" "public_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.public.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "public" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.public.id
  http_method             = aws_api_gateway_method.public_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = data.aws_lambda_function.fulfillment.invoke_arn
}
#CORS preflight for /public
resource "aws_api_gateway_method" "public_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.public.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "public_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.public.id
  http_method   = aws_api_gateway_method.public_options.http_method
  type          = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "public_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.public.id
  http_method = aws_api_gateway_method.public_options.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "public_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.public.id
  http_method = aws_api_gateway_method.public_options.http_method
  status_code = aws_api_gateway_method_response.public_options.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  depends_on = [
    aws_api_gateway_integration.public,
    aws_api_gateway_integration.public_options,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# STAGE
resource "aws_api_gateway_stage" "this" {
  stage_name    = var.environment
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id

  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}

###PRIVATE
# resource "aws_api_gateway_resource" "private" {
#   rest_api_id = aws_api_gateway_rest_api.this.id
#   parent_id   = aws_api_gateway_resource.root.id
#   path_part   = "private"
# }

# resource "aws_api_gateway_method" "private_post" {
#   rest_api_id   = aws_api_gateway_rest_api.this.id
#   resource_id   = aws_api_gateway_resource.private.id
#   http_method   = "POST"
#   authorization = "COGNITO_USER_POOLS"
#   authorizer_id = aws_api_gateway_authorizer.cognito.id
# }

# resource "aws_api_gateway_integration" "private" {
#   rest_api_id             = aws_api_gateway_rest_api.this.id
#   resource_id             = aws_api_gateway_resource.private.id
#   http_method             = aws_api_gateway_method.private_post.http_method
#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = data.aws_lambda_function.fulfillment.invoke_arn
# }

# resource "aws_api_gateway_method" "private_options" {
#   rest_api_id   = aws_api_gateway_rest_api.this.id
#   resource_id   = aws_api_gateway_resource.private.id
#   http_method   = "OPTIONS"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_integration" "private_options" {
#   rest_api_id   = aws_api_gateway_rest_api.this.id
#   resource_id   = aws_api_gateway_resource.private.id
#   http_method   = aws_api_gateway_method.private_options.http_method
#   type          = "MOCK"
#   request_templates = {
#     "application/json" = "{\"statusCode\": 200}"
#   }
# }

# resource "aws_api_gateway_method_response" "private_options" {
#   rest_api_id = aws_api_gateway_rest_api.this.id
#   resource_id = aws_api_gateway_resource.private.id
#   http_method = aws_api_gateway_method.private_options.http_method
#   status_code = "200"
#   response_models = {
#     "application/json" = "Empty"
#   }
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = true
#     "method.response.header.Access-Control-Allow-Methods" = true
#     "method.response.header.Access-Control-Allow-Origin"  = true
#   }
# }

# resource "aws_api_gateway_integration_response" "private_options" {
#   rest_api_id = aws_api_gateway_rest_api.this.id
#   resource_id = aws_api_gateway_resource.private.id
#   http_method = aws_api_gateway_method.private_options.http_method
#   status_code = aws_api_gateway_method_response.private_options.status_code
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization'"
#     "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
#     "method.response.header.Access-Control-Allow-Origin"  = "'*'"
#   }
# }

# resource "aws_api_gateway_authorizer" "cognito" {
#   name          = "${var.api_name}-authorizer"
#   rest_api_id   = aws_api_gateway_rest_api.this.id
#   type          = "COGNITO_USER_POOLS"
#   provider_arns = [var.cognito_user_pool_arn]
# }