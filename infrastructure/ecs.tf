# ECS Cluster
resource "aws_ecs_cluster" "nutri_track_cluster" {
  name = "nutritrack-cluster"
}

# Task Definition
resource "aws_ecs_task_definition" "nutritrack_api_task" {
  family                   = "nutritrack-api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "3072"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "api-container"
      image = var.docker_image
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "AWS_S3_CACHE_BUCKET"
          value = aws_s3_bucket.my_bucket.bucket
        },
        {
          name  = "AWS_DEFAULT_REGION"
          value = "ap-southeast-2"
        }
      ]
      secrets = [
        {
          name      = "USDA_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.nutritrack_api_keys.arn}:USDA_API_KEY::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/nutritrack-api"
          "awslogs-region"        = "ap-southeast-2"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Security Group: ALB — allow HTTP from anywhere
resource "aws_security_group" "alb_sg" {
  name        = "nutritrack-alb-sg"
  description = "Allow HTTP inbound to ALB"
  vpc_id      = aws_vpc.nutri-track-vpc.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name  = "nutritrack-alb-sg"
    Owner = "user_deployment"
  }
}

# Security Group: ECS — only allow traffic from ALB
resource "aws_security_group" "nutritrack_api_sg" {
  name        = "nutritrack-api-sg"
  description = "Allow traffic from ALB only"
  vpc_id      = aws_vpc.nutri-track-vpc.id

  ingress {
    description     = "Allow from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name  = "nutritrack-api-sg"
    Owner = "user_deployment"
  }
}

# Application Load Balancer
resource "aws_lb" "nutritrack_alb" {
  name               = "nutritrack-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets = [
    aws_subnet.nutri-track-public-subnet.id,
    aws_subnet.nutri-track-public-subnet-2.id,
  ]

  tags = {
    Name  = "nutritrack-alb"
    Owner = "user_deployment"
  }
}

# Target Group
resource "aws_lb_target_group" "nutritrack_tg" {
  name        = "nutritrack-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.nutri-track-vpc.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name  = "nutritrack-tg"
    Owner = "user_deployment"
  }
}

# ALB Listener — HTTP port 80
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.nutritrack_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nutritrack_tg.arn
  }
}

# ECS Service
resource "aws_ecs_service" "nutritrack_api_service" {
  name            = "nutritrack-api-service"
  cluster         = aws_ecs_cluster.nutri_track_cluster.id
  task_definition = aws_ecs_task_definition.nutritrack_api_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.nutri-track-public-subnet.id]
    security_groups  = [aws_security_group.nutritrack_api_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nutritrack_tg.arn
    container_name   = "api-container"
    container_port   = 8000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_task_execution_role_policy,
    aws_iam_role_policy.secrets_manager_access,
    aws_iam_role_policy.bedrock_s3_access,
  ]

  tags = {
    Name  = "nutritrack-api-service"
    Owner = "user_deployment"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "nutritrack_api_logs" {
  name              = "/ecs/nutritrack-api"
  retention_in_days = 30

  tags = {
    Name  = "nutritrack-api-logs"
    Owner = "user_deployment"
  }
}

# Output ALB DNS — dùng làm ECS_BASE_URL cho vision-router Lambda
output "alb_dns_name" {
  description = "ALB DNS name — set as ECS_BASE_URL in vision-router Lambda env"
  value       = "http://${aws_lb.nutritrack_alb.dns_name}"
}
