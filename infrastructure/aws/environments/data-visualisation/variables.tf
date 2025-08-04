variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project tag used on all resources"
  type        = string
  default     = "dal-scooter-team-6"
}

# S3 bucket used for DynamoDB exports
variable "export_bucket_name" {
  description = "Name of the S3 bucket that stores exported DynamoDB data"
  type        = string
  default     = "dal-scooter-team-6-data-visualization"
}

# DynamoDB table you want to export
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table to export"
  type        = string
  default     = "bookings-table-dev"
}

# ARN of that DynamoDB table (match the value in your tfstate)
variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table to export"
  type        = string
  default     = "arn:aws:dynamodb:ca-central-1:796973501829:table/bookings-table-dev"
}

# EventBridge schedule expression (change to cron(...) if desired)
variable "schedule_expression" {
  description = "Schedule for the export Lambda (rate or cron expression)"
  type        = string
  default     = "rate(1 day)" 
}

variable "lambda_timeout" {
  description = "Timeout (seconds) for the export Lambda"
  type        = number
  default     = 300
}
