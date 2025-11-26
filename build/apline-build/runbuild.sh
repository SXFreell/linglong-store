#!/usr/bin/env sh
# runbuild.sh
# 在 Alpine 上运行构建脚本

set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "======================================"
echo "  玲珑应用商店 自动构建"
echo "======================================"
echo ""
echo "脚本目录: $SCRIPT_DIR"
echo "项目目录: $PROJECT_ROOT"
echo ""

# 切换到脚本目录
cd "$SCRIPT_DIR"

echo "==> 运行安装 bash 脚本..."
sh "$SCRIPT_DIR/install-bash.sh"

echo ""
echo "==> 运行安装依赖脚本..."
bash "$SCRIPT_DIR/install-deps-alpine.sh"

echo ""
echo "==> 切换到项目目录..."
cd "$PROJECT_ROOT"
echo "当前目录: $(pwd)"

echo ""
echo "==> 运行构建脚本..."
bash "$SCRIPT_DIR/build.sh"