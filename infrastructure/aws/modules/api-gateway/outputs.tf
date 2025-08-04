output "api_endpoint_url" {
  description = "Complete API endpoint URL for create-bike"
  value       = "https://${aws_api_gateway_rest_api.this.id}.execute-api.${var.region}.amazonaws.com/${var.environment}/create-bike"
}

output "booking_assigner_lambda_arn" {
  description = "ARN of the booking assigner Lambda function"
  value       = aws_lambda_function.booking-assigner.arn
}