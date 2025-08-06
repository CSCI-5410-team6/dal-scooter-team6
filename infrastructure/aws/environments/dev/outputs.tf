output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "sns_topic_arn" {
  value = module.sns.sns_topic_arn
}

output "lex_bot_arn" {
  value = module.lex.lex_bot_arn
}

output "bookings_table_arn" {
  value = module.dynamodb.bookings_table_arn
}