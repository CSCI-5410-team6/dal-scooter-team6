module "api_gateway" {
  source                = "../../modules/api_gateway"
  environment           = "dev"
  api_name              = "DalScooterChatbotApi-dev"
  lambda_function_name  = module.chat_bot.lambda_function_name
  #cognito_user_pool_arn = aws_cognito_user_pool.ebike_pool.arn
}
