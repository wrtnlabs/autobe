#!/bin/bash
set -euxo pipefail

# Update system
dnf update -y

# Setup 4GB swap (RAM 2GB + swap 4GB = 6GB)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

# Install Git
dnf install -y git

# Create app directory
mkdir -p /opt/autobe
chown ec2-user:ec2-user /opt/autobe

# Install Node.js 20 and pnpm
dnf install -y nodejs20
npm install -g pnpm@9

echo "User data setup complete. API port: ${api_port}"
