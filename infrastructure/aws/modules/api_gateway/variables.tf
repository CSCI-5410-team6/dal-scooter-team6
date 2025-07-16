variable "environment" {
  type = string
}

variable "api_name" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito User Pool for authorizer (optional)"
  default     = ""
}