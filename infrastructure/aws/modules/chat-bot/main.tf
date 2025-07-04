terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.9.0"
    }
  }
}

# IAM role for Lex V2
resource "aws_iam_role" "lex_role" {
  name = "LexV2BotRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "lex.amazonaws.com"
        },
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
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = "*"
      }
    ]
  })
}

# Lex V2 Bot
resource "aws_lexv2models_bot" "dal_scooter_bot" {
  name                       = var.bot_name
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

# Locale with an Intent
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

# Lambda function for fulfillment
resource "aws_lambda_function" "general_fulfillment" {
  function_name = var.lambda_function_name
  handler       = "general_fulfillment.lambda_handler"
  runtime       = "python3.9"
  filename      = var.lambda_zip_path
  role          = aws_iam_role.lambda_exec.arn

  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}

# Lambda IAM role
resource "aws_iam_role" "lambda_exec" {
  name = "${var.lambda_function_name}Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
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

# Lambda basic execution policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.lambda_function_name}Policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for Lex V2 to invoke
resource "aws_lambda_permission" "lex_invoke" {
  statement_id  = "AllowLexInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.general_fulfillment.function_name
  principal     = "lex.amazonaws.com"
}
