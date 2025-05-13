#!/bin/bash

# 检查某些命令是否存在
if ! command -v curl &> /dev/null; then
  echo "未检测到 curl，正在尝试安装..."
  if [ -f /etc/debian_version ]; then
    sudo apt update && sudo apt install -y curl
  elif [ -f /etc/redhat-release ]; then
    sudo yum install -y curl
  elif [ -f /etc/arch-release ]; then
    sudo pacman -Sy curl --noconfirm
  fi
fi
