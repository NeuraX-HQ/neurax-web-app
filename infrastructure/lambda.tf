# This file defines the Lambda function for the NutriTrack API. The function is a simple handler that returns a success message when invoked. The code is packaged as a zip file using the archive_file data source, which allows us to easily deploy it to AWS Lambda.
data "archive_file" "nutriTrack_lambda" {
  type        = "zip"
  output_path = "${path.module}/nutriTrack_lambda.zip"
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'NutriTrack API Ready' }; };"
    filename = "index.js"
  }
}


resource "aws_lambda_function" "api_backend" {
  filename         = data.archive_file.nutriTrack_lambda.output_path
  function_name    = "${var.project_name}-api-handler"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.nutriTrack_lambda.output_base64sha256
  runtime          = "nodejs24.x"  # Chạy trên môi trường Node.js 24
  environment {
    variables = {
      FOODS_TABLE       = aws_dynamodb_table.food.name
      INGREDIENTS_TABLE = aws_dynamodb_table.ingredients.name
    }
  }
}

