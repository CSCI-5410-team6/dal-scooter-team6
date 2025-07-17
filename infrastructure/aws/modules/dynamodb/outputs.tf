output "bookings_table_arn" {
  description = "ARN of the bookings table"
  value       = aws_dynamodb_table.bookings_table.arn
}