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