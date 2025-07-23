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
 
# Bookings Table (existing - unchanged)
resource "aws_dynamodb_table" "bookings_table" {
  name         = "bookings-table-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bookingId"
 
  attribute {
    name = "bookingId"
    type = "S"
  }
 
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}
 
# Bikes Table
resource "aws_dynamodb_table" "bikes_table" {
  name         = "bikes-table-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bikeId"
 
  attribute {
    name = "bikeId"
    type = "S"
  }
 
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}
 
# Feedback Table
resource "aws_dynamodb_table" "feedback_table" {
  name         = "feedback-table-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"
 
  attribute {
    name = "feedbackId"
    type = "S"
  }
 
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}
 
# Tickets Table
resource "aws_dynamodb_table" "tickets_table" {
  name         = "tickets-table-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ticketId"
 
  attribute {
    name = "ticketId"
    type = "S"
  }
 
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}