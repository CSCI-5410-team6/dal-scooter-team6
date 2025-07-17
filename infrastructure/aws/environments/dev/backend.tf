terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "dal-scooter-team-6-terraform-state-dev"
    key            = "infrastructure/terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "dal-scooter-team-6-terraform-state-lock"
  }
}

provider "aws" {
  region = "ca-central-1"
}
module "chat_bot" {
  source = "../../modules/chat-bot"
  bot_name = "DalScooterBotDev"
  lambda_function_name = "General-Fulfillment-dev"
  lambda_zip_path = "../../../../chatbot/lex-bot/fulfillment/general_fulfillment.py.zip"
  environment = "dev"
}
module "cognito" {
  source = "../../modules/cognito"
  region           = var.aws_region
  user_pool_name   = "DALScooterUserPoolDev"
  sns_topic_name   = "DALScooterNotificationsDev"

  project_name = var.project_name    
  environment  = var.environment     
}

module "api_gateway" {
  source                = "../../modules/api_gateway"
  api_name              = "DALScooterChatbotAPI"
  lambda_function_name  = "chatbot_handler"
  cognito_user_pool_arn = module.cognito.user_pool_arn
  environment           = var.environment
}

variable "environment" {
  description = "The environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}
