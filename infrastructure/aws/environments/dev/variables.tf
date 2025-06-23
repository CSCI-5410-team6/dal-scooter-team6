# infrastructure/bootstrap/variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "dal-scooter-team-6"
}

variable "environments" {
  description = "List of environments"
  type        = string
  default     = "dev"
}