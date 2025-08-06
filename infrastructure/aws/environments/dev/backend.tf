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

module "dynamodb" {
  source        = "../../modules/dynamodb"
  region        = "ca-central-1"
  project_name  = var.project_name
  environment   = var.environment
}

module "sns" {
  source        = "../../modules/sns-sqs"
  region        = "ca-central-1"
  project_name  = var.project_name
  environment   = var.environment
}
module "lex" {
  source              = "../../modules/chat-bot"
  region              = "ca-central-1"
  bot_name            = "DalScooterBot"
  lambda_function_name = "GeneralFulfillment"
  lambda_zip_path     = "../../../../chatbot/lex-bot/fulfillment/general_fulfillment.py.zip"
  project_name        = var.project_name
  environment         = var.environment
  sns_topic_arn       = module.sns.sns_topic_arn
  bookings_table_arn  = module.dynamodb.bookings_table_arn
}
module "cognito" {
  source            = "../../modules/cognito"
  region            = "ca-central-1"
  user_pool_name    = "DALScooterUserPool"
  sns_topic_name    = "DALScooterNotifications"
  project_name      = var.project_name
  environment       = var.environment
  bookings_table_arn = module.dynamodb.bookings_table_arn
}

module "api_gateway" {
  source                        = "../../modules/api-gateway"
  region                        = "ca-central-1"
  project_name                  = var.project_name
  environment                   = var.environment
  cognito_user_pool_arn         = module.cognito.user_pool_arn
  cognito_user_pool_id          = module.cognito.user_pool_id
  sns_topic_arn                 = module.sns.sns_topic_arn
  booking_requests_queue_url    = module.sns.booking_requests_queue_url
  booking_requests_queue_arn    = module.sns.booking_requests_queue_arn
  ticket_assignment_sns_topic_arn = module.sns.ticket_assignment_sns_topic_arn
  ticket_processing_queue_arn     = module.sns.ticket_processing_queue_arn
}


variable "environment" {
  description = "The environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}
