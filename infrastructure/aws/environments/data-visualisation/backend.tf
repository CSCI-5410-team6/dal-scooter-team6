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

module "dynamodb_export_lambda" {
  source              = "../../modules/lambda_export"
  function_name       = "lambda_visualisation"
  lambda_source       = "../../../../monitoring/lambda_visualisation.py"
  dynamodb_table_name = var.dynamodb_table_name
  dynamodb_table_arn  = var.dynamodb_table_arn
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

output "export_lambda_name" {
  value = module.dynamodb_export_lambda.lambda_function_name
}
