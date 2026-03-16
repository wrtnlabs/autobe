# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "autobe-dev-vpc" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# 인터넷 게이트웨이
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "autobe-dev-igw" }
}

# 퍼블릭 서브넷 (EC2 + RDS)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "autobe-dev-public-${count.index + 1}" }
}

# 퍼블릭 라우트 테이블
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "autobe-dev-public-rt" }
}

# 퍼블릭 서브넷에 라우트 테이블 연결
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# RDS 서브넷 그룹
resource "aws_db_subnet_group" "main" {
  name       = "autobe-dev-db-subnet"
  subnet_ids = aws_subnet.public[*].id

  tags = { Name = "autobe-dev-db-subnet-group" }
}

# EC2 보안 그룹
resource "aws_security_group" "ec2" {
  name_prefix = "autobe-dev-ec2-"
  description = "Security group for dev EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "NestJS API"
    from_port   = tonumber(local.api_port)
    to_port     = tonumber(local.api_port)
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Swagger UI"
    from_port   = 37810
    to_port     = 37810
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "autobe-dev-ec2-sg" }
}

# RDS 보안 그룹
resource "aws_security_group" "rds" {
  name_prefix = "autobe-dev-rds-"
  description = "Security group for dev RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from anywhere (dev)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "autobe-dev-rds-sg" }
}
