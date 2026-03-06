# create table dynaomodb for food
resource "aws_dynamodb_table" "food" {
  name           = "food"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "food_id"

  attribute {
    name = "food_id"
    type = "S" # S: String
  }
  tags = {
    Project = var.project_name
    Owner = "nutritrack"
  }
}

# create table dynaomodb for ingredients
resource "aws_dynamodb_table" "ingredients" {
  name           = "ingredients"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ingredient_id"

  attribute {
    name = "ingredient_id"
    type = "S" # S: String
  }
  tags = {
    Project = var.project_name
    Owner = "nutritrack"
  }
}

# IAM Role for Lambda to access DynamoDB
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn  = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"  # Cấp quyền Full Access vào DB (Trong thực tế có thể thu hẹp quyền lại)
}

# IAM Role for Lambda basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}