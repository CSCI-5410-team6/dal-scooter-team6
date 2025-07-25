output "api_endpoint_url" {
  description = "Complete API endpoint URL for create-bike"
  value       = "https://${aws_api_gateway_rest_api.this.id}.execute-api.${var.region}.amazonaws.com/${var.environment}/create-bike"
}