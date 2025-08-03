output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.dalscooter_notifications.arn
}

output "booking_requests_queue_url" {
  description = "URL of the booking requests SQS queue"
  value       = aws_sqs_queue.booking_requests.url
}

output "booking_requests_queue_arn" {
  description = "ARN of the booking requests SQS queue"
  value       = aws_sqs_queue.booking_requests.arn
}