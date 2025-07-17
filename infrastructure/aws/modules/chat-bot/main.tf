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

# IAM Role for Lex V2
resource "aws_iam_role" "lex_role" {
  name = "LexV2BotRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lex.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "lex_role_policy" {
  name = "LexV2BotPolicy-${var.environment}"
  role = aws_iam_role.lex_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.general_fulfillment.arn
      }
    ]
  })
}

# Lex V2 Bot
resource "aws_lexv2models_bot" "dal_scooter_bot" {
  name                       = "${var.bot_name}-${var.environment}"
  role_arn                   = aws_iam_role.lex_role.arn
  idle_session_ttl_in_seconds = 300

  data_privacy {
    child_directed = false
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Locale with Intents
resource "aws_lexv2models_bot_locale" "dal_booking_bot_locale" {
  bot_id                         = aws_lexv2models_bot.dal_scooter_bot.id
  bot_version                    = "DRAFT"
  locale_id                      = "en_US"
  n_lu_intent_confidence_threshold = 0.7

  description = "English locale for Dal Scooter Bot"

  voice_settings {
    voice_id = "Salli"
  }
}

# Lambda Function for Fulfillment
resource "aws_lambda_function" "general_fulfillment" {
  function_name    = "${var.lambda_function_name}-${var.environment}"
  handler          = "general_fulfillment.lambda_handler"
  runtime          = "python3.9"
  filename         = var.lambda_zip_path
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_exec" {
  name = "${var.lambda_function_name}Role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Lambda Policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.lambda_function_name}Policy-${var.environment}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = var.bookings_table_arn
      },
      {
        Effect = "Allow"
        Action = "sns:Publish"
        Resource = var.sns_topic_arn
      }
    ]
  })
}

# Lambda Permission for Lex
resource "aws_lambda_permission" "lex_invoke" {
  statement_id  = "AllowLexInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.general_fulfillment.function_name
  principal     = "lex.amazonaws.com"
  source_arn    = aws_lexv2models_bot.dal_scooter_bot.arn
}