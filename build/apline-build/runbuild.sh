#!/usr/bin/env sh
# runbuild.sh
# 在 Alpine 上运行构建脚本

set -e

echo "==> 运行安装 bash 脚本..."
sh ./install-bash.sh

echo "==> 运行安装依赖脚本..."
bash ./install-deps-alpine.sh

echo "==> 运行构建脚本..."
bash ./build.sh