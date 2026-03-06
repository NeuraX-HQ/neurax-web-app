# Hướng dẫn Triển Khai AWS bằng Terraform (Infrastructure as Code)

Tài liệu này cung cấp cho bạn cấu hình Terraform để triển khai toàn bộ hạ tầng Serverless cho NutriTrack trên AWS. Phương pháp này chuyên nghiệp hơn so với việc click thủ công trên AWS Console, giúp bạn dễ dàng quản lý, thêm sửa xóa resource sau này bằng code.

---

## 1. Tổng quan Kiến trúc Terraform

Chúng ta sẽ dùng Terraform để tự động tạo ra:
1. **2 bảng DynamoDB**: `NutriTrack_Foods` và `NutriTrack_Ingredients`.
2. **1 hàm AWS Lambda**: Xử lý logic nghiệp vụ (gọi AI, truy vấn DB).
3. **1 API Gateway**: Điểm vào (Endpoint) cho Mobile App gọi đến Lambda.
4. **IAM Roles & Policies**: Cấp quyền cho Lambda đọc/ghi vào DynamoDB và gọi các services khác.

---

## 2. Cấu trúc thư mục Terraform

Trong thư mục dự án của bạn, hãy tạo một thư mục mới tên là `infrastructure` (nằm ngoài thư mục code JS/TS hiện tại).

```text
NutriTrack/
├── app/
├── db/
├── infrastructure/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── lambda_src/ (Thư mục chứa code zip của backend thực tế)
```

---

## 3. Các file cấu hình Terraform mẫu

Hãy tạo các file dưới đây trong thư mục `infrastructure/`.

### 3.1. `variables.tf` (Biến cấu hình)
Định nghĩa các biến dùng chung giúp code gọn gàng hơn.

```hcl
variable "aws_region" {
  description = "Region triển khai AWS"
  type        = string
  default     = "ap-southeast-1" # Đổi thành region bạn muốn (Singapore)
}

variable "project_name" {
  description = "Tên dự án để đặt tiền tố cho các resources"
  type        = string
  default     = "nutritrack"
}
```

### 3.2. `main.tf` (Định nghĩa Resource Chính)

Đây là "trái tim" của việc provisioning AWS:

```hcl
provider "aws" {
  region = var.aws_region
}

# ==========================================
# 1. DYNAMODB TABLES
# ==========================================

# Bảng Món Ăn (Foods)
resource "aws_dynamodb_table" "foods_table" {
  name           = "${var.project_name}-Foods"
  billing_mode   = "PAY_PER_REQUEST" # Serverless cực kỳ tiết kiệm, không tính theo giờ chờ
  hash_key       = "food_id"

  attribute {
    name = "food_id"
    type = "S" # S: String
  }

  tags = {
    Project = var.project_name
  }
}

# Bảng Nguyên Liệu (Ingredients)
resource "aws_dynamodb_table" "ingredients_table" {
  name           = "${var.project_name}-Ingredients"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ingredient_id"

  attribute {
    name = "ingredient_id"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}

# ==========================================
# 2. IAM ROLE VÀ POLICY CHO LAMBDA
# ==========================================

# Tạo Role cho Lambda
resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.project_name}-lambda-role"

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

# Cấp quyền cho Lambda để Query/Scan DynamoDB và ghi Log (CloudWatch)
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn  = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"  # Cấp quyền Full Access vào DB (Trong thực tế có thể thu hẹp quyền lại)
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ==========================================
# 3. AWS LAMBDA FUNCTION
# ==========================================
# Giả định bạn đã zip code Node.js của backend vào file lambda_function_payload.zip
# Tạm thời tạo Dummy function, sau này tự update code qua CI/CD
data "archive_file" "dummy_lambda" {
  type        = "zip"
  output_path = "${path.module}/dummy_lambda.zip"
  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: 'NutriTrack API Ready' }; };"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "api_backend" {
  filename         = data.archive_file.dummy_lambda.output_path
  function_name    = "${var.project_name}-api-handler"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.dummy_lambda.output_base64sha256
  runtime          = "nodejs20.x"  # Chạy trên môi trường Node.js 20

  environment {
    variables = {
      FOODS_TABLE       = aws_dynamodb_table.foods_table.name
      INGREDIENTS_TABLE = aws_dynamodb_table.ingredients_table.name
    }
  }
}

# ==========================================
# 4. API GATEWAY (HTTP API - Phiên bản tiết kiệm & nhanh)
# ==========================================

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default" # Tự động deploy mọi cấu hình API mới vào stage mặc định
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.http_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api_backend.invoke_arn
}

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
```

### 3.3. `outputs.tf` (Kết quả trả về sau khi Deploy)
Giúp bạn lấy ngay địa chỉ API Gateway Endpoint để gọi từ App React Native.

```hcl
output "api_endpoint" {
  description = "Địa chỉ API Gateway để NutriTrack Mobile App kết nối vào"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "foods_table_name" {
  value = aws_dynamodb_table.foods_table.name
}

output "ingredients_table_name" {
  value = aws_dynamodb_table.ingredients_table.name
}
```

---

## 4. Hướng dẫn chạy Terraform

**Môi trường yêu cầu:** 
- Đã cài [Terraform CLI](https://developer.hashicorp.com/terraform/downloads).
- Đã chạy `aws configure` để cấu hình Admin Credentials rên máy của bạn (giống trên hướng dẫn import DynamoDB).

### Các bước thực thi trên Terminal:

1. **Khởi tạo Terraform (Tải AWS provider plugin):**
   Mở terminal tại thư mục `infrastructure/` và chạy:
   ```bash
   terraform init
   ```

2. **Kiểm tra trước kế hoạch thay đổi (Vẽ ra sơ đồ AWS sẽ tạo mạng nào, server nào mà chưa chạy thật):**
   ```bash
   terraform plan
   ```
   *Terminal sẽ hiện ra danh sách các DB, API, Lambda... sẽ được tạo trên bảng điều khiển AWS.*

3. **Thực thi Deploy Lên AWS (Go Live):**
   ```bash
   terraform apply
   ```
   - Gõ `yes` khi được hỏi có xác nhận thực thi không.
   - Khi hoàn thành, màn hình xanh lá cây sẽ hiện ra URL của API (Ví dụ: `api_endpoint = "https://abc123yz.execute-api.ap-southeast-1.amazonaws.com"`). Copy URL này nhét vào file `.env` trên App Mobile.

4. **Cách Destroy (Xóa sạch toàn bộ rác trên AWS) nếu không dùng nữa để đỡ tốn tiền:**
   ```bash
   terraform destroy
   ```

*(Ghi chú: Hiện tôi đã để phần Lambda code tạo ở mức "Dummy Function". Việc deploy code thật (gọi Gemini qua API, truy vấn logic DB...) vào Lambda bạn có thể upload file Zip code js thật đè lên sau ở AWS console hoặc dùng quy trình CI/CD).*
