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

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for booking notifications"
  type        = string
}

variable "booking_requests_queue_url" {
  description = "URL of the SQS queue for booking requests"
  type        = string
}

variable "booking_requests_queue_arn" {
  description = "ARN of the SQS queue for booking requests"
  type        = string
}

variable "ticket_assignment_sns_topic_arn" {
  description = "ARN of the SNS topic for ticket assignment"
  type        = string
}

variable "ticket_processing_queue_arn" {
  description = "ARN of the SQS queue for ticket processing"
  type        = string
}