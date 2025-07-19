variable "region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Project name tag"
  type        = string
  default     = "dal-scooter-team-6"
}

variable "environment" {
  description = "Environment name tag"
  type        = string
}