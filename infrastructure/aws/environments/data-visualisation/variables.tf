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

variable "export_bucket_name" {
  description = "Name of the S3 bucket that stores exported DynamoDB data"
  type        = string
  default     = "dal-scooter-team-6-data-visualization"
}

variable "dynamodb_table_name_DALScooterUsers1" {
  description = "Name of the DynamoDB table to export"
  type        = string
  default     = "DALScooterUsers1"
}

variable "dynamodb_table_name_feedback-table-dev" {
  description = "Name of the DynamoDB table to export"
  type        = string
  default     = "feedback-table-dev"
}

variable "dynamodb_table_name_bikes_table-dev" {
  description = "Name of the DynamoDB table to export"
  type        = string
  default     = "bikes-table-dev"
  
}
variable "dynamodb_table_arn_DALScooterUsers1" {
  description = "ARN of the DynamoDB table to export"
  type        = string
  default     = "arn:aws:dynamodb:ca-central-1:796973501829:table/DALScooterUsers1"
}

variable "dynamodb_table_arn_feedback-table-dev" {
  description = "ARN of the feedback DynamoDB table"
  type        = string
  default     = "arn:aws:dynamodb:ca-central-1:796973501829:table/feedback-table-dev"
}

variable "dynamodb_table_arn_bikes_table-dev" {
  description = "ARN of the bikes DynamoDB table"
  type        = string
  default     = "arn:aws:dynamodb:ca-central-1:796973501829:table/bikes-table-dev"
}
variable "schedule_expression" {
  description = "Schedule for the export Lambda (rate or cron expression)"
  type        = string
  default     = "rate(7 days)" 
}

variable "lambda_timeout" {
  description = "Timeout (seconds) for the export Lambda"
  type        = number
  default     = 300
}
