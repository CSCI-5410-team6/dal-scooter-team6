variable "api_name" {
  type        = string
  description = "API Gateway name"
}

variable "lambda_function_name" {
  type        = string
  description = "Name of the Lambda function to integrate"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito User Pool"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, prod, etc.)"
}
