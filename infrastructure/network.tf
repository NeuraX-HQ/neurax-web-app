# Create a VPC
resource "aws_vpc" "nutri-track-vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Owner = "user_deployment"
  }
}

# Public Subnet AZ-a (for ECS + ALB)
resource "aws_subnet" "nutri-track-public-subnet" {
  vpc_id                  = aws_vpc.nutri-track-vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-southeast-2a"
  map_public_ip_on_launch = true

  tags = {
    Name  = "nutritrack-public-subnet-a"
    Owner = "user_deployment"
  }
}

# Public Subnet AZ-b (ALB requires 2 AZs)
resource "aws_subnet" "nutri-track-public-subnet-2" {
  vpc_id                  = aws_vpc.nutri-track-vpc.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = "ap-southeast-2b"
  map_public_ip_on_launch = true

  tags = {
    Name  = "nutritrack-public-subnet-b"
    Owner = "user_deployment"
  }
}

# Private Subnet (reserved for future use)
resource "aws_subnet" "nutri-track-private-subnet" {
  vpc_id            = aws_vpc.nutri-track-vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-southeast-2b"

  tags = {
    Name  = "nutritrack-private-subnet"
    Owner = "user_deployment"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "nutri-track-igw" {
  vpc_id = aws_vpc.nutri-track-vpc.id

  tags = {
    Owner = "user_deployment"
  }
}

# Route Table for public subnets
resource "aws_route_table" "nutri-track-public-rt" {
  vpc_id = aws_vpc.nutri-track-vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nutri-track-igw.id
  }

  tags = {
    Name  = "nutritrack-public-rt"
    Owner = "user_deployment"
  }
}

resource "aws_route_table_association" "public-subnet-a" {
  subnet_id      = aws_subnet.nutri-track-public-subnet.id
  route_table_id = aws_route_table.nutri-track-public-rt.id
}

resource "aws_route_table_association" "public-subnet-b" {
  subnet_id      = aws_subnet.nutri-track-public-subnet-2.id
  route_table_id = aws_route_table.nutri-track-public-rt.id
}
