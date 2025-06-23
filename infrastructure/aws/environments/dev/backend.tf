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