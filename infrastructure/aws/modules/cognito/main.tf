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

# DynamoDB Table for Users
resource "aws_dynamodb_table" "dalscooter_users" {
  name         = "DALScooterUsers-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# SNS Topic
resource "aws_sns_topic" "dalscooter_notifications" {
  name = "DALScooterNotifications-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "DALScooterLambdaRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name = "DALScooterLambdaPolicy-${var.environment}"

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
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.dalscooter_users.arn,
          var.bookings_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:*"
        ]
        Resource = aws_cognito_user_pool.dalscooter_user_pool.arn
      },
      {
        Effect = "Allow"
        Action = "sns:Publish"
        Resource = aws_sns_topic.dalscooter_notifications.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda Functions
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_lambda_function" "validate_signup" {
  filename         = "../../../../cognito/lambda_zip/ValidateSignUpLambda.py.zip"
  function_name    = "ValidateSignUpLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "ValidateSignUpLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/ValidateSignUpLambda.py.zip")
  tags             = local.common_tags
}

resource "aws_lambda_function" "post_confirmation" {
  filename         = "../../../../cognito/lambda_zip/PostConfirmationLambda.py.zip"
  function_name    = "PostConfirmationLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "PostConfirmationLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/PostConfirmationLambda.py.zip")
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.dalscooter_notifications.arn
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "define_auth_challenge" {
  filename         = "../../../../cognito/lambda_zip/DefineAuthChallengeLambda.py.zip"
  function_name    = "DefineAuthChallengeLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "DefineAuthChallengeLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/DefineAuthChallengeLambda.py.zip")
  tags             = local.common_tags
}

resource "aws_lambda_function" "create_auth_challenge" {
  filename         = "../../../../cognito/lambda_zip/CreateAuthChallengeLambda.py.zip"
  function_name    = "CreateAuthChallengeLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "CreateAuthChallengeLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/CreateAuthChallengeLambda.py.zip")
  tags             = local.common_tags
}

resource "aws_lambda_function" "verify_auth_challenge" {
  filename         = "../../../../cognito/lambda_zip/VerifyAuthChallengeResponseLambda.py.zip"
  function_name    = "VerifyAuthChallengeResponseLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "VerifyAuthChallengeResponseLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/VerifyAuthChallengeResponseLambda.py.zip")
  tags             = local.common_tags
}

resource "aws_lambda_function" "post_authentication" {
  filename         = "../../../../cognito/lambda_zip/PostAuthenticationLambda.py.zip"
  function_name    = "PostAuthenticationLambda-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "PostAuthenticationLambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../../../../cognito/lambda_zip/PostAuthenticationLambda.py.zip")
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.dalscooter_notifications.arn
    }
  }
  tags = local.common_tags
}

# Cognito User Pool
resource "aws_cognito_user_pool" "dalscooter_user_pool" {
  name                     = "${var.user_pool_name}-${var.environment}"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "userType"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  schema {
    name                = "questions"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      max_length = 2048
    }
  }

  lambda_config {
    pre_sign_up                    = aws_lambda_function.validate_signup.arn
    post_confirmation              = aws_lambda_function.post_confirmation.arn
    define_auth_challenge          = aws_lambda_function.define_auth_challenge.arn
    create_auth_challenge          = aws_lambda_function.create_auth_challenge.arn
    verify_auth_challenge_response = aws_lambda_function.verify_auth_challenge.arn
    post_authentication            = aws_lambda_function.post_authentication.arn
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  tags = local.common_tags
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "dalscooter_client" {
  name         = "DALScooterClient-${var.environment}"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id

  explicit_auth_flows = [
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]
}

# Cognito User Groups
resource "aws_cognito_user_group" "customers_group" {
  name         = "Customers"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  description  = "Group for registered customers"
  precedence   = 1
}

resource "aws_cognito_user_group" "franchise_operators_group" {
  name         = "FranchiseOperators"
  user_pool_id = aws_cognito_user_pool.dalscooter_user_pool.id
  description  = "Group for franchise operators"
  precedence   = 2
}

# IAM Role for Customers Group
resource "aws_iam_role" "customers_role" {
  name = "CustomersRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Federated = "cognito-identity.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "customers_policy" {
  name = "CustomersPolicy-${var.environment}"
  role = aws_iam_role.customers_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "sns:Publish"
        ]
        Resource = [
          var.bookings_table_arn,
          aws_sns_topic.dalscooter_notifications.arn
        ]
      }
    ]
  })
}

# IAM Role for Franchise Operators Group
resource "aws_iam_role" "franchise_operators_role" {
  name = "FranchiseOperatorsRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Federated = "cognito-identity.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "franchise_operators_policy" {
  name = "FranchiseOperatorsPolicy-${var.environment}"
  role = aws_iam_role.franchise_operators_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "dynamodb:GetItem"
        Resource = var.bookings_table_arn
      }
    ]
  })
}

# Lambda Permissions
resource "aws_lambda_permission" "cognito_permission_validate_signup" {
  statement_id  = "AllowCognitoInvokeValidateSignUp"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validate_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_permission_post_confirmation" {
  statement_id  = "AllowCognitoInvokePostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_permission_define_auth" {
  statement_id  = "AllowCognitoInvokeDefineAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.define_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_permission_create_auth" {
  statement_id  = "AllowCognitoInvokeCreateAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_permission_verify_auth" {
  statement_id  = "AllowCognitoInvokeVerifyAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verify_auth_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_lambda_permission" "cognito_permission_post_authentication" {
  statement_id  = "AllowCognitoInvokePostAuthentication"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_authentication.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.dalscooter_user_pool.arn
}

resource "aws_cognito_identity_pool" "dalscooter_identity_pool" {
  identity_pool_name               = "DALScooterIdentityPool-${var.environment}"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id = aws_cognito_user_pool_client.dalscooter_client.id
    provider_name = aws_cognito_user_pool.dalscooter_user_pool.endpoint
  }

  tags = local.common_tags
}