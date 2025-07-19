variable "region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "dal-scooter-team-6"
}

variable "bot_name" {
  description = "Name of the Lex bot"
  type        = string
  default     = "DalScooterBot"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function for fulfillment"
  type        = string
  default     = "GeneralFulfillment"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda function zip file"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic"
  type        = string
}

variable "bookings_table_arn" {
  description = "ARN of the bookings DynamoDB table"
  type        = string
}