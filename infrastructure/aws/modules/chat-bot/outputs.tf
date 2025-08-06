output "lex_bot_arn" {
  description = "ARN of the Lex bot"
  value       = aws_lexv2models_bot.dal_scooter_bot.arn
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.general_fulfillment.arn
}
output "lex_bot_id" {
  description = "ID of the Lex bot"
  value       = aws_lexv2models_bot.dal_scooter_bot.id
}