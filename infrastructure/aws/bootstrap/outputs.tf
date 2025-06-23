output "state_bucket_names" {
  description = "Names of the S3 buckets for Terraform state"
  value       = { for k, v in aws_s3_bucket.terraform_state : k => v.bucket }
}

output "state_bucket_arns" {
  description = "ARNs of the S3 buckets for Terraform state"
  value       = { for k, v in aws_s3_bucket.terraform_state : k => v.arn }
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.arn
}