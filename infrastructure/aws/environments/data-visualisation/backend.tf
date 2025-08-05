terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "export_s3" {
  source      = "../../modules/s3"
  bucket_name = var.export_bucket_name
  environment = var.environment
    project_name = var.project_name
}

module "dynamodb" {
  source       = "../../modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

module "dynamodb_export_lambda_DBScooterUsers1" {
  source              = "../../modules/lambda_export"
  function_name       = "lambda_visualisation"
  lambda_source       = "../../../../monitoring/lambda_visualisation.py"
  dynamodb_table_name = var.dynamodb_table_name_DALScooterUsers1
  dynamodb_table_arn  = var.dynamodb_table_arn_DALScooterUsers1
  s3_bucket_name      = module.export_s3.bucket_name
  s3_bucket_arn       = "arn:aws:s3:::${module.export_s3.bucket_name}"
  schedule_expression = var.schedule_expression
  lambda_timeout      = var.lambda_timeout
  environment = var.environment
    project_name = var.project_name
}

module "dynamodb_export_lambda_feedback-table-dev" {
  source              = "../../modules/lambda_export"
  function_name       = "lambda_visualisation_feedback"
  lambda_source       = "../../../../monitoring/lambda_visualisation.py"
  dynamodb_table_name = var.dynamodb_table_name_feedback-table-dev
  dynamodb_table_arn  = var.dynamodb_table_arn_feedback-table-dev
  s3_bucket_name      = module.export_s3.bucket_name
  s3_bucket_arn       = "arn:aws:s3:::${module.export_s3.bucket_name}"
  schedule_expression = var.schedule_expression
  lambda_timeout      = var.lambda_timeout
  environment = var.environment
    project_name = var.project_name
}

module "dynamodb_export_lambda_bikes-table-dev" {
  source              = "../../modules/lambda_export"
  function_name       = "lambda_visualisation_bikes"
  lambda_source       = "../../../../monitoring/lambda_visualisation.py"
  dynamodb_table_name = var.dynamodb_table_name_bikes_table-dev
  dynamodb_table_arn  = var.dynamodb_table_arn_bikes_table-dev
  s3_bucket_name      = module.export_s3.bucket_name
  s3_bucket_arn       = "arn:aws:s3:::${module.export_s3.bucket_name}"
  schedule_expression = var.schedule_expression
  lambda_timeout      = var.lambda_timeout
  environment = var.environment
    project_name = var.project_name
  
}

output "export_bucket_name" {
  value = module.export_s3.bucket_name
}

output "export_lambda_name_DBScooterUsers1" {
  value = module.dynamodb_export_lambda_DBScooterUsers1.lambda_function_name
}

output "name_export_lambda_feedback-table-dev" {
  value = module.dynamodb_export_lambda_feedback-table-dev.lambda_function_name
  
}

output "name_export_lambda_bikes-table-dev" {
  value = module.dynamodb_export_lambda_bikes-table-dev.lambda_function_name
  
}