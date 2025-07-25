variable "region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "Environment name tag"
  type        = string
}

variable "project_name" {
  description = "Project name tag"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to integrate with API Gateway"
  type        = string
}