# --- Network ---
variable "ssh_allowed_cidr" {
  description = "CIDR for SSH access to EC2"
  type        = string
  default     = "0.0.0.0/0"
}

# --- RDS ---
variable "rds_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

# --- EC2 ---
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
