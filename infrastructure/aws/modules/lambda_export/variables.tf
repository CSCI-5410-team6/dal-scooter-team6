variable "function_name" {
  description = "Name of the Lambda function to create"
  type        = string
}

variable "lambda_source" {
  description = "Path to the Python source file (.py)"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table to scan"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table to scan"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for the exported files"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket (optional)"
  type        = string
  default     = null
}

variable "schedule_expression" {
  description = "Cron or rate expression for the EventBridge rule"
  type        = string
  default     = "rate(7 days)"
}

variable "lambda_timeout" {
  description = "Lambda timeout (seconds)"
  type        = number
  default     = 300
}

variable "region" {
  description = "AWS region"
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
