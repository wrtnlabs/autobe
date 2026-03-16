resource "aws_db_parameter_group" "pg17" {
  name   = "autobe-dev-pg17"
  family = "postgres17"

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }

  tags = { Name = "autobe-dev-pg17-params" }
}

resource "aws_db_instance" "main" {
  identifier     = "autobe-dev"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.rds_instance_class

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = local.postgres_database
  username = local.postgres_username
  password = local.postgres_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.pg17.name

  publicly_accessible = true
  multi_az            = false
  skip_final_snapshot = true

  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = { Name = "autobe-dev-rds" }
}
