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

resource "aws_sqs_queue" "ticket_processing_queue" {
  name                      = "DALScooterTicketProcessing-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 60

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


# SQS Queue Dead Letter Queue
resource "aws_sqs_queue" "ticket_processing_dlq" {
  name = "DALScooterTicketProcessing-DLQ-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# SNS Topic for ticket assignment
resource "aws_sns_topic" "ticket_assignment" {
  name = "DALScooterTicketAssignment-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Redrive policy for ticket processing queue
resource "aws_sqs_queue_redrive_policy" "ticket_processing_redrive" {
  queue_url = aws_sqs_queue.ticket_processing_queue.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ticket_processing_dlq.arn
    maxReceiveCount     = 3
  })
}

# SQS Queue Policy to allow SNS to publish messages
resource "aws_sqs_queue_policy" "ticket_processing_queue_policy" {
  queue_url = aws_sqs_queue.ticket_processing_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSNSPublish"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.ticket_processing_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.ticket_assignment.arn
          }
        }
      }
    ]
  })
}

# SNS Subscription to SQS
resource "aws_sns_topic_subscription" "ticket_assignment_to_sqs" {
  topic_arn = aws_sns_topic.ticket_assignment.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.ticket_processing_queue.arn
}