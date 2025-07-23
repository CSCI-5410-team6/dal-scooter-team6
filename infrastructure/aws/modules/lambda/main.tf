variable "environment" {
  description = "Deployment environment (e.g., dev, prod)"
  type        = string
}

resource "aws_iam_role" "lambda_exec" {
  name = "test-lambda-exec-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "test" {
  function_name = "test"
  handler       = "test.lambda_handler"
  runtime       = "python3.9"
  filename      = "../../../../backend/lambda_functions/test.py.zip"
  role          = aws_iam_role.lambda_exec.arn
  source_code_hash = "../../../../backend/lambda_functions/test.py.zip"
  tags = {
    Project     = "dal-scooter-team-6"
    Environment = var.environment
  }
} 