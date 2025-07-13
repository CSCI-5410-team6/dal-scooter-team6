variable "project_name" {
  description = "Name of the project"
  type = string
  default = "dal-scooter-team-6"
}

variable "bot_name" {
  description = "Name of the Lex bot"
  type = string
  default = "DalScooterBotDev"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function for fulfillment"
  type = string
  default = "GeneralFulfillment"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda function zip file"
  type = string
}

variable "environment" {
  description = "Deployment environment (dev or prod)"
  type = string
}