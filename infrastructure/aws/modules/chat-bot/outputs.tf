output "lex_bot_arn" {
  description = "ARN of the lex bot"
  value = aws_lexv2models_bot.dal_scooter_bot
}

output "lambda_function_name" {
  description = "ARN of the Lambda function"
  value = aws_lambda_function.general_fulfillment.arn
}