variable "bucket_name" {
  description = "The name of the S3 bucket to create"
  type        = string
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