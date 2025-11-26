#!/usr/bin/env sh
# runbuild.sh
# 在 Alpine 上运行构建脚本

set -e

echo "==> 运行安装 bash 脚本..."
sh ./install-bash.sh

echo "==> 运行安装依赖脚本..."
bash ./install-deps-alpine.sh

echo "==> 设置 Rust 环境变量..."
export PATH="$HOME/.cargo/bin:$PATH"
source "$HOME/.cargo/env"

echo "==> 安装前端依赖..."
pnpm install

echo "==> 运行构建脚本..."
bash ./build.sh