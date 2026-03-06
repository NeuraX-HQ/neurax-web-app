# create s3 storage for image upload
resource "aws_s3_bucket" "nutriTrack_images" {
  bucket = "nutritrack-images"
}

# create s3 bucket policy
resource "aws_s3_bucket_policy" "nutriTrack_images_policy" {
  bucket = aws_s3_bucket.nutriTrack_images.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "s3:*"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Resource = [
          aws_s3_bucket.nutriTrack_images.arn,
          "${aws_s3_bucket.nutriTrack_images.arn}/*"
        ]
      }
    ]
  })
}