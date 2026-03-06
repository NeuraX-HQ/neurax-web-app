# This file defines the API Gateway configuration for the NutriTrack application. It creates an HTTP API with CORS enabled, sets up a default stage for deployment, and integrates the API with a Lambda function that serves as the backend. The route is configured to forward all requests to the Lambda function, and permissions are granted to allow API Gateway to invoke the Lambda function.

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

# Tạo stage mặc định để tự động deploy mọi thay đổi API mới
resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default" # Tự động deploy mọi cấu hình API mới vào stage mặc định
  auto_deploy = true
}

# Tạo integration giữa API Gateway và Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.http_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api_backend.invoke_arn
}

# Tạo route để chuyển hướng tất cả các yêu cầu đến Lambda
resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}" # Route mọi thứ ({proxy+}) vào Lambda
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Cho phép API Gateway gọi Lambda
resource "aws_lambda_permission" "apigw_lambda_exec" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}