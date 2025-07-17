terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_dynamodb_table" "bookings_table" {
  name = "bookings-table-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "bookingId"

  attribute {
    name = "bookingId"
    type = "S"
  }

  tags = {
    Project = var.project_name
    Environment = var.environment
  }
  }
