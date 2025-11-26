#!/usr/bin/env sh
# install-bash.sh
# 在 Alpine 上安装 Bash

set -e

echo "==> 更新 APK 包索引..."
apk update

echo "==> 安装 Bash..."
apk add --no-cache bash

echo "Bash 安装完成: $(bash --version | head -n 1)"
