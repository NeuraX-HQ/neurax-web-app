variable "aws_region" {
  description = "Region triển khai AWS"
  type        = string
  default     = "us-east-1" # Đổi thành region bạn muốn (Singapore)
}
variable "project_name" {
  description = "NutriTrack"
  type        = string
  default     = "nutritrack"
}