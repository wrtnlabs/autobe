locals {
  env_file  = file("${path.module}/../../.env")
  env_lines = [for line in split("\n", local.env_file) : trimspace(line)]
  env_map = { for line in local.env_lines :
    trimspace(split("=", line)[0]) => trimspace(join("=", slice(split("=", line), 1, length(split("=", line)))))
    if length(line) > 0 && !startswith(line, "#") && length(split("=", line)) >= 2
  }

  # .env에서 읽어온 값들
  aws_region        = lookup(local.env_map, "AWS_REGION", "ap-northeast-2")
  postgres_database = lookup(local.env_map, "POSTGRES_DATABASE", "wrtnlabs")
  postgres_username = lookup(local.env_map, "POSTGRES_USERNAME", "autobe")
  postgres_password = lookup(local.env_map, "POSTGRES_PASSWORD", "")
  postgres_schema   = lookup(local.env_map, "POSTGRES_SCHEMA", "autobe")
  api_port          = lookup(local.env_map, "API_PORT", "37001")
}

# EC2에 전송할 .env 내용
# 로컬 .env를 베이스로, terraform이 관리하는 동적 값만 덮어씀
locals {
  deploy_overrides = {
    "POSTGRES_HOST" = aws_db_instance.main.address
    "POSTGRES_PORT" = tostring(aws_db_instance.main.port)
    "POSTGRES_URL"  = "postgresql://${local.postgres_username}:${local.postgres_password}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${local.postgres_database}?schema=${local.postgres_schema}"
  }

  deploy_merged = merge(local.env_map, local.deploy_overrides)
  deploy_env    = join("\n", [for k, v in local.deploy_merged : "${k}=${v}"])
}
