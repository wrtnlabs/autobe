output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_instance.dev_server.public_ip
}

output "ec2_public_dns" {
  description = "EC2 instance public DNS"
  value       = aws_instance.dev_server.public_dns
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_hostname" {
  description = "RDS hostname"
  value       = aws_db_instance.main.address
}

output "postgres_url" {
  description = "Full PostgreSQL connection URL"
  value       = "postgresql://${local.postgres_username}:${local.postgres_password}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${local.postgres_database}?schema=${local.postgres_schema}"
  sensitive   = true
}

output "application_url" {
  description = "Application URL"
  value       = "http://${aws_instance.dev_server.public_ip}:${local.api_port}"
}

output "swagger_url" {
  description = "Swagger UI URL"
  value       = "http://${aws_instance.dev_server.public_ip}:37810/api-docs"
}

output "ssh_command" {
  description = "SSH command to connect to EC2"
  value       = "ssh -i ${local_file.ec2_private_key.filename} ec2-user@${aws_instance.dev_server.public_ip}"
}

output "rds_tunnel_command" {
  description = "SSH tunnel command for RDS access"
  value       = "ssh -i ${local_file.ec2_private_key.filename} -L 5432:${aws_db_instance.main.address}:5432 ec2-user@${aws_instance.dev_server.public_ip}"
}
