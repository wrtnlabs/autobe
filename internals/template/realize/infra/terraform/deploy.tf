# 로컬에서 소스 압축 → EC2로 전송 → EC2에서 빌드/배포
resource "null_resource" "deploy" {
  triggers = {
    always_run = timestamp()
  }

  # 1. 로컬에서 프로젝트를 tar.gz로 압축
  provisioner "local-exec" {
    working_dir = "${path.module}/../.."
    command     = "COPYFILE_DISABLE=1 tar -czf /tmp/autobe-app-deploy.tar.gz --exclude=node_modules --exclude=.git --exclude=lib --exclude=dist --exclude=.context --exclude=template ."
  }

  connection {
    type        = "ssh"
    user        = "ec2-user"
    private_key = tls_private_key.ec2.private_key_pem
    host        = aws_instance.dev_server.public_ip
    timeout     = "5m"
  }

  # 2. tar.gz를 EC2로 전송
  provisioner "file" {
    source      = "/tmp/autobe-app-deploy.tar.gz"
    destination = "/opt/autobe/app-deploy.tar.gz"
  }

  # 3. .env를 EC2로 직접 전송 (RDS 엔드포인트 등 동적 값 포함)
  provisioner "file" {
    content     = local.deploy_env
    destination = "/opt/autobe/.env"
  }

  # 4. deploy.sh를 EC2로 전송
  provisioner "file" {
    content = templatefile("${path.module}/templates/deploy.sh.tpl", {
      api_port = local.api_port
    })
    destination = "/opt/autobe/deploy.sh"
  }

  # 5. 배포 실행
  provisioner "remote-exec" {
    inline = [
      "chmod +x /opt/autobe/deploy.sh",
      "/opt/autobe/deploy.sh"
    ]
  }

  depends_on = [
    aws_instance.dev_server,
    aws_db_instance.main
  ]
}
