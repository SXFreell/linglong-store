#!/usr/bin/env bash
#
# build.sh
# 在 Ubuntu 上构建 Tauri 应用并打包为 AppImage（包含 WebKit 等动态库）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "======================================"
echo "  玲珑应用商店 AppImage 构建脚本"
echo "======================================"
echo ""
echo "项目目录: $PROJECT_ROOT"
echo ""

cd "$PROJECT_ROOT"

# 确保 Rust 环境可用
if ! command -v rustc &> /dev/null; then
    echo "⚠ Rust 未在 PATH 中，尝试加载环境..."
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
        echo "✓ Rust 环境已加载"
    else
        echo "❌ 错误: Rust 未安装"
        echo "请先运行: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        exit 1
    fi
fi

echo "✓ Rust: $(rustc --version)"
echo "✓ Cargo: $(cargo --version)"
echo "✓ Node.js: $(node --version)"
echo "✓ pnpm: $(pnpm --version)"
echo ""

# # 清理旧的构建产物
# echo "==> 清理旧构建产物..."
# rm -rf linglong-store.AppDir
# rm -f linglong-store-*.AppImage
# echo "✓ 清理完成"
# echo ""

# # 安装前端依赖
# if [ ! -d "node_modules" ]; then
#     echo "==> 安装前端依赖..."
#     pnpm install
#     echo "✓ 依赖安装完成"
# else
#     echo "✓ 前端依赖已存在"
# fi
# echo ""

# # 构建 Tauri 应用
# echo "==> 构建 Tauri 应用..."
# echo "命令: pnpm build:pro"
# echo ""
# pnpm build:pro

echo ""
echo "==> 查找构建产物..."

# 查找二进制文件（Ubuntu 使用 gnu 目标）
BINARY_PATH=""
POSSIBLE_PATHS=(
    "$PROJECT_ROOT/src-tauri/target/x86_64-unknown-linux-gnu/release/linglong-store"
    "$PROJECT_ROOT/src-tauri/target/release/linglong-store"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        BINARY_PATH="$path"
        echo "✓ 找到二进制文件: $path"
        break
    fi
done

if [ -z "$BINARY_PATH" ]; then
    echo "❌ 错误: 找不到编译后的二进制文件"
    echo "已尝试的路径:"
    for path in "${POSSIBLE_PATHS[@]}"; do
        echo "  - $path"
    done
    exit 1
fi


BINARY_SIZE=$(du -h "$BINARY_PATH" | cut -f1)
echo "✓ 文件大小: $BINARY_SIZE"
echo ""

# 分析二进制文件的依赖
echo "==> 分析动态库依赖..."
echo ""
ldd "$BINARY_PATH" 2>/dev/null | head -n 20
TOTAL_DEPS=$(ldd "$BINARY_PATH" 2>/dev/null | grep "=>" | wc -l)
echo ""
echo "✓ 发现 $TOTAL_DEPS 个动态库依赖"
echo ""

# 准备 desktop 文件，交由 linuxdeploy 写入 AppDir
DESKTOP_FILE="$SCRIPT_DIR/linglong-store.desktop"
echo "==> 生成 desktop 文件供 linuxdeploy 使用..."
cat > "$DESKTOP_FILE" << 'DESKTOP_EOF'
[Desktop Entry]
Name=Linglong Store
Name[zh_CN]=玲珑应用商店
Comment=Application store for Linglong packages
Comment[zh_CN]=玲珑应用程序包管理器
Exec=linglong-store
Icon=linglong-store
Type=Application
Categories=System;PackageManager;
Terminal=false
StartupNotify=true
DESKTOP_EOF
echo "✓ desktop 文件创建完成: $DESKTOP_FILE"
echo ""

# 校验图标资源，实际复制由 linuxdeploy 完成
ICON_SOURCE="$PROJECT_ROOT/public/logo.png"
if [ -f "$ICON_SOURCE" ]; then
    echo "✓ 图标已就绪: $ICON_SOURCE"
else
    echo "⚠ 警告: 未找到图标文件: $ICON_SOURCE"
fi
echo ""

# 使用 linuxdeploy 打包 AppImage
echo "==> 使用 linuxdeploy 打包 AppImage..."

# 检查 linuxdeploy 是否存在
LINUXDEPLOY="$PROJECT_ROOT/linuxdeploy-x86_64.AppImage"
if [ ! -f "$LINUXDEPLOY" ]; then
    echo "下载 linuxdeploy..."
    wget -q --show-progress https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage -O "$LINUXDEPLOY"
    chmod +x "$LINUXDEPLOY"
    echo "✓ linuxdeploy 下载完成"
fi

# 检查 linuxdeploy-plugin-checkrt 是否存在
CHECKRT_PLUGIN="$PROJECT_ROOT/linuxdeploy-plugin-checkrt.sh"
if [ ! -f "$CHECKRT_PLUGIN" ]; then
    echo "下载 linuxdeploy-plugin-checkrt..."
    wget -q --show-progress https://github.com/darealshinji/linuxdeploy-plugin-checkrt/releases/download/r4/linuxdeploy-plugin-checkrt.sh -O "$CHECKRT_PLUGIN"
    chmod +x "$CHECKRT_PLUGIN"
    echo "✓ linuxdeploy-plugin-checkrt 下载完成"
fi

# 设置环境变量，将插件目录加入 PATH
export DEPLOY_GTK_VERSION=3
export PATH="$PROJECT_ROOT:$PATH"

# 准备 linuxdeploy 输出目录，让其自行生成 AppDir
LINUXDEPLOY_APPDIR="$PROJECT_ROOT/linglong-store.AppDir"
if [ -d "$LINUXDEPLOY_APPDIR" ]; then
    rm -rf "$LINUXDEPLOY_APPDIR"
fi

# 设置环境变量
export ARCH=x86_64
export OUTPUT="$PROJECT_ROOT/linglong-store-x86_64.AppImage"


echo ""
echo "正在打包 AppImage..."

# 使用 linuxdeploy 打包（其会自动收集依赖并填充 AppDir）
LINUXDEPLOY_ARGS=(
    "--appdir" "$LINUXDEPLOY_APPDIR"
    "--plugin" "checkrt"
    "--output" "appimage"
    "--executable" "$BINARY_PATH"
    "--desktop-file" "$DESKTOP_FILE"
)

if [ -f "$ICON_SOURCE" ]; then
    LINUXDEPLOY_ARGS+=("--icon-file" "$ICON_SOURCE")
fi

"$LINUXDEPLOY" "${LINUXDEPLOY_ARGS[@]}"

# 检查是否成功生成
if [ -f "$OUTPUT" ]; then
    chmod +x "$OUTPUT"
    
    FINAL_SIZE=$(du -h "$OUTPUT" | cut -f1)
    
    echo ""
    echo "======================================"
    echo "  ✅ 构建成功！"
    echo "======================================"
    echo ""
    echo "输出文件: $OUTPUT"
    echo "文件大小: $FINAL_SIZE"
    echo ""
    echo "运行方式:"
    echo "  $OUTPUT"
    echo ""
    echo "特性:"
    echo "  ✓ 使用 linuxdeploy 自动处理依赖"
    echo "  ✓ 使用 checkrt 插件自动检测运行时兼容性"
    echo "  ✓ 单文件分发"
    echo ""
else
    echo ""
    echo "❌ 错误: AppImage 文件未生成"
    echo ""
    echo "故障排除:"
    echo "  1. 检查 AppDir 是否完整: ls -lh $LINUXDEPLOY_APPDIR"
    echo "  2. 手动测试: $LINUXDEPLOY_APPDIR/AppRun"
    echo "  3. 查看日志获取详细错误信息"
    echo ""
    exit 1
fi
