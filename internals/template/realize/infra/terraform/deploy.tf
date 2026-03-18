# Compress source locally → Transfer to EC2 → Build/Deploy on EC2
resource "null_resource" "deploy" {
  triggers = {
    always_run = timestamp()
  }

  # 1. Compress project to tar.gz locally
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

  # 2. Transfer tar.gz to EC2
  provisioner "file" {
    source      = "/tmp/autobe-app-deploy.tar.gz"
    destination = "/opt/autobe/app-deploy.tar.gz"
  }

  # 3. Send .env directly to EC2 (includes dynamic values like RDS endpoint)
  provisioner "file" {
    content     = local.deploy_env
    destination = "/opt/autobe/.env"
  }

  # 4. Transfer deploy.sh to EC2
  provisioner "file" {
    content = templatefile("${path.module}/templates/deploy.sh.tpl", {
      api_port = local.api_port
    })
    destination = "/opt/autobe/deploy.sh"
  }

  # 5. Execute deployment
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
