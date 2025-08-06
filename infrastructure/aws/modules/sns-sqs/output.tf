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

output "ticket_assignment_sns_topic_arn" {
  description = "ARN of the SNS topic for ticket assignment"
  value       = aws_sns_topic.ticket_assignment.arn
}

output "ticket_processing_queue_arn" {
  description = "ARN of the SQS queue for ticket processing"
  value       = aws_sqs_queue.ticket_processing_queue.arn
}

output "ticket_processing_queue_url" {
  description = "URL of the SQS queue for ticket processing"
  value       = aws_sqs_queue.ticket_processing_queue.url
}