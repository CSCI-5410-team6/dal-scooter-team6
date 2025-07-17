output "user_pool_id" {
  value = aws_cognito_user_pool.dalscooter_user_pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.dalscooter_client.id
}

output "sns_topic_arn" {
  value = aws_sns_topic.dalscooter_notifications.arn
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.dalscooter_user_pool.arn
}