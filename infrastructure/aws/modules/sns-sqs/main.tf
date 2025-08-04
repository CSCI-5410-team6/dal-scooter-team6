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

# SQS Queue for booking requests
resource "aws_sqs_queue" "booking_requests" {
  name                      = "dalscooter-booking-requests-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600  # 14 days

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Dead letter queue for failed booking requests
resource "aws_sqs_queue" "booking_requests_dlq" {
  name = "dalscooter-booking-requests-dlq-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Redrive policy for the main queue
resource "aws_sqs_queue_redrive_policy" "booking_requests_redrive" {
  queue_url = aws_sqs_queue.booking_requests.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.booking_requests_dlq.arn
    maxReceiveCount     = 3
  })
}