output "api_endpoint" {
  description = "Địa chỉ API Gateway để NutriTrack Mobile App kết nối vào"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
output "foods_table_name" {
  value = aws_dynamodb_table.food.name
}
output "ingredients_table_name" {
  value = aws_dynamodb_table.ingredients.name
}