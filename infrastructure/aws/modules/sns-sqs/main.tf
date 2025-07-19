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

resource "aws_sns_topic" "dalscooter_notifications" {
  name = "DALScooterNotifications-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}