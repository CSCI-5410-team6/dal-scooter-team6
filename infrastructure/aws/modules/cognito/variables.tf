variable "region" {
  description = "AWS region"
  default     = "ca-central-1"
}

variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  default     = "DALScooterUserPool"
}

variable "sns_topic_name" {
  description = "Name of the SNS Topic"
  default     = "DALScooterNotifications"
}
variable "project_name" {
  description = "Project name tag"
  type        = string
}

variable "environment" {
  description = "Environment name tag"
  type        = string
}