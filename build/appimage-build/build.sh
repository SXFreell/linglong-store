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
    echo "❌ 错误: Rust 未安装或未在 PATH 中"
    echo "请运行: source \$HOME/.cargo/env"
    exit 1
fi

echo "✓ Rust: $(rustc --version)"
echo "✓ Cargo: $(cargo --version)"
echo "✓ Node.js: $(node --version)"
echo "✓ pnpm: $(pnpm --version)"
echo ""

# 清理旧的构建产物
echo "==> 清理旧构建产物..."
rm -rf AppDir
rm -f linglong-store-*.AppImage
echo "✓ 清理完成"
echo ""

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "==> 安装前端依赖..."
    pnpm install
    echo "✓ 依赖安装完成"
else
    echo "✓ 前端依赖已存在"
fi
echo ""

# 构建 Tauri 应用
echo "==> 构建 Tauri 应用..."
echo "命令: pnpm build:pro"
echo ""
pnpm build:pro

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

# 创建 AppDir 结构
APPDIR="$PROJECT_ROOT/AppDir"
echo "==> 创建 AppDir 结构..."
rm -rf "$APPDIR"
mkdir -p "$APPDIR"/{usr/bin,usr/lib,usr/share/applications,usr/share/icons/hicolor/256x256/apps}
echo "✓ 目录结构创建完成"
echo ""

# 复制二进制文件
echo "==> 复制二进制文件..."
cp "$BINARY_PATH" "$APPDIR/usr/bin/linglong-store"

# Strip 二进制以减小体积
BEFORE_SIZE=$(du -h "$APPDIR/usr/bin/linglong-store" | cut -f1)
strip "$APPDIR/usr/bin/linglong-store" 2>/dev/null || true
AFTER_SIZE=$(du -h "$APPDIR/usr/bin/linglong-store" | cut -f1)
echo "✓ 二进制文件: $BEFORE_SIZE → $AFTER_SIZE (已优化)"
echo ""

# 收集动态库依赖
echo "==> 收集动态库依赖..."

# 用于记录已处理的库（避免重复）
declare -A PROCESSED_LIBS

collect_deps() {
    local binary="$1"
    local lib_dir="$2"
    local indent="${3:-  }"
    
    # 获取依赖
    local deps=$(ldd "$binary" 2>/dev/null | grep "=>" | awk '{print $3}' | grep -v "^$" || true)
    
    for lib in $deps; do
        if [ ! -f "$lib" ]; then
            continue
        fi
        
        lib_name=$(basename "$lib")
        
        # 跳过已处理的库
        if [ -n "${PROCESSED_LIBS[$lib_name]}" ]; then
            continue
        fi
        
        # 跳过系统基础库（glibc）
        case "$lib_name" in
            libc.so*|libm.so*|libdl.so*|libpthread.so*|librt.so*|libresolv.so*|ld-linux*.so*|linux-vdso.so*)
                echo "${indent}[跳过] $lib_name (系统库)"
                PROCESSED_LIBS[$lib_name]=1
                ;;
            *)
                if [ ! -f "$lib_dir/$lib_name" ]; then
                    echo "${indent}[复制] $lib_name"
                    cp -L "$lib" "$lib_dir/" 2>/dev/null || {
                        echo "${indent}[警告] 无法复制 $lib_name"
                        continue
                    }
                    PROCESSED_LIBS[$lib_name]=1
                    
                    # 递归收集此库的依赖
                    collect_deps "$lib" "$lib_dir" "${indent}  "
                fi
                ;;
        esac
    done
}

# 开始收集
collect_deps "$APPDIR/usr/bin/linglong-store" "$APPDIR/usr/lib"

COPIED_LIBS=$(find "$APPDIR/usr/lib" -name "*.so*" | wc -l)
LIBS_SIZE=$(du -sh "$APPDIR/usr/lib" | cut -f1)
echo ""
echo "✓ 已复制 $COPIED_LIBS 个动态库，总大小: $LIBS_SIZE"
echo ""

# 复制 WebKit 和 GTK 的关键数据文件
echo "==> 复制 WebKit/GTK 数据文件..."

COPIED_DATA=0

# WebKit 进程和资源
if [ -d "/usr/lib/webkit2gtk-4.1" ]; then
    mkdir -p "$APPDIR/usr/lib/webkit2gtk-4.1"
    if cp -r /usr/lib/webkit2gtk-4.1/* "$APPDIR/usr/lib/webkit2gtk-4.1/" 2>/dev/null; then
        echo "  ✓ WebKit 进程文件"
        COPIED_DATA=$((COPIED_DATA + 1))
    fi
fi

# GDK Pixbuf 加载器
if [ -d "/usr/lib/gdk-pixbuf-2.0" ]; then
    mkdir -p "$APPDIR/usr/lib/gdk-pixbuf-2.0"
    if cp -r /usr/lib/gdk-pixbuf-2.0/* "$APPDIR/usr/lib/gdk-pixbuf-2.0/" 2>/dev/null; then
        echo "  ✓ GDK Pixbuf 加载器"
        COPIED_DATA=$((COPIED_DATA + 1))
    fi
fi

# GIO 模块
if [ -d "/usr/lib/gio/modules" ]; then
    mkdir -p "$APPDIR/usr/lib/gio/modules"
    if cp -r /usr/lib/gio/modules/* "$APPDIR/usr/lib/gio/modules/" 2>/dev/null; then
        echo "  ✓ GIO 模块"
        COPIED_DATA=$((COPIED_DATA + 1))
    fi
fi

echo "✓ 已复制 $COPIED_DATA 项数据文件"
echo ""

# 创建 AppRun 启动脚本
echo "==> 创建 AppRun 启动脚本..."
cat > "$APPDIR/AppRun" << 'APPRUN_EOF'
#!/bin/bash
# AppRun - AppImage 启动脚本

SELF=$(readlink -f "$0")
HERE=${SELF%/*}

# 设置库路径（优先使用 AppImage 内的库）
export LD_LIBRARY_PATH="$HERE/usr/lib:$LD_LIBRARY_PATH"

# 设置 GTK/WebKit 相关环境变量
export GDK_PIXBUF_MODULE_FILE="$HERE/usr/lib/gdk-pixbuf-2.0/2.10.0/loaders.cache"
export GDK_PIXBUF_MODULEDIR="$HERE/usr/lib/gdk-pixbuf-2.0/2.10.0/loaders"
export WEBKIT_INJECTED_BUNDLE_PATH="$HERE/usr/lib/webkit2gtk-4.1/injected-bundle"
export GIO_MODULE_DIR="$HERE/usr/lib/gio/modules"

# 禁用 GTK 的某些不需要的功能
export GTK_PATH=""
export GTK_MODULES=""

# 运行应用
exec "$HERE/usr/bin/linglong-store" "$@"
APPRUN_EOF
chmod +x "$APPDIR/AppRun"
echo "✓ AppRun 脚本创建完成"
echo ""

# 创建 desktop 文件
echo "==> 创建 .desktop 文件..."
cat > "$APPDIR/linglong-store.desktop" << 'DESKTOP_EOF'
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
echo "✓ desktop 文件创建完成"
echo ""

# 复制图标
echo "==> 复制应用图标..."
# 尝试多个可能的图标路径
ICON_PATHS=(
    "$PROJECT_ROOT/public/logo.png"
    "$PROJECT_ROOT/src-tauri/icons/icon.png"
    "$PROJECT_ROOT/icons/icon.png"
    "$PROJECT_ROOT/src-tauri/icons/128x128.png"
)

ICON_COPIED=0
for ICON_SOURCE in "${ICON_PATHS[@]}"; do
    if [ -f "$ICON_SOURCE" ]; then
        cp "$ICON_SOURCE" "$APPDIR/linglong-store.png"
        cp "$ICON_SOURCE" "$APPDIR/usr/share/icons/hicolor/256x256/apps/linglong-store.png"
        ln -sf ../../linglong-store.png "$APPDIR/.DirIcon"
        echo "✓ 图标复制完成: $ICON_SOURCE"
        ICON_COPIED=1
        break
    fi
done

if [ $ICON_COPIED -eq 0 ]; then
    echo "⚠ 警告: 未找到图标文件，尝试的路径:"
    for path in "${ICON_PATHS[@]}"; do
        echo "  - $path"
    done
    # 创建一个默认图标占位
    touch "$APPDIR/linglong-store.png"
    cp "$APPDIR/linglong-store.png" "$APPDIR/usr/share/icons/hicolor/256x256/apps/linglong-store.png"
    ln -sf ../../linglong-store.png "$APPDIR/.DirIcon"
fi
echo ""

# 创建必要的符号链接
ln -sf linglong-store.desktop "$APPDIR/usr/share/applications/linglong-store.desktop"

# 显示 AppDir 统计信息
echo "======================================"
echo "  AppDir 创建完成"
echo "======================================"
APPDIR_SIZE=$(du -sh "$APPDIR" | cut -f1)
FILE_COUNT=$(find "$APPDIR" -type f | wc -l)
echo "目录: $APPDIR"
echo "大小: $APPDIR_SIZE"
echo "文件: $FILE_COUNT 个"
echo ""

# 打包为 AppImage
echo "==> 打包 AppImage..."
OUTPUT_FILE="$PROJECT_ROOT/linglong-store-x86_64.AppImage"

if ! command -v appimagetool &> /dev/null; then
    echo "❌ 错误: appimagetool 未安装"
    echo ""
    echo "AppDir 已创建: $APPDIR"
    echo "可以手动测试: $APPDIR/AppRun"
    echo ""
    echo "安装 appimagetool："
    echo "  wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    echo "  chmod +x appimagetool-x86_64.AppImage"
    echo "  sudo mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool"
    exit 1
fi

# 检查 FUSE 支持
echo "==> 检查打包环境..."
FUSE_AVAILABLE=0
if [ -e /dev/fuse ]; then
    echo "✓ FUSE 设备可用"
    FUSE_AVAILABLE=1
else
    echo "⚠ FUSE 不可用（Docker 容器环境）"
    echo "  将使用静态提取方式打包"
fi

# 设置环境变量
export ARCH=x86_64
export NO_CLEANUP=1

echo ""
echo "正在打包 AppImage..."

# 下载 appimagetool（如果不存在）
APPIMAGETOOL="$PROJECT_ROOT/appimagetool"
if [ ! -f "$APPIMAGETOOL" ]; then
    echo "下载 appimagetool..."
    wget -q --show-progress https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage -O "$APPIMAGETOOL"
    chmod +x "$APPIMAGETOOL"
    echo "✓ appimagetool 下载完成"
fi

# 使用 appimagetool 打包
if [ $FUSE_AVAILABLE -eq 0 ]; then
    echo "使用 --appimage-extract-and-run 模式（无 FUSE）..."
    "$APPIMAGETOOL" --appimage-extract-and-run "$APPDIR" "$OUTPUT_FILE" 2>&1 | grep -v "WARNING" || true
else
    echo "使用标准模式（FUSE 可用）..."
    "$APPIMAGETOOL" --no-appstream "$APPDIR" "$OUTPUT_FILE" 2>&1 | grep -v "WARNING" || true
fi

# 检查是否成功生成
if [ -f "$OUTPUT_FILE" ]; then
    chmod +x "$OUTPUT_FILE"
    
    FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo ""
    echo "======================================"
    echo "  ✅ 构建成功！"
    echo "======================================"
    echo ""
    echo "输出文件: $OUTPUT_FILE"
    echo "文件大小: $FINAL_SIZE"
    echo ""
    echo "运行方式:"
    echo "  $OUTPUT_FILE"
    echo ""
    if [ $FUSE_AVAILABLE -eq 0 ]; then
        echo "提示: 在无 FUSE 环境中运行需要:"
        echo "  $OUTPUT_FILE --appimage-extract-and-run"
        echo ""
    fi
    echo "特性:"
    echo "  ✓ 内置动态库 (webkit2gtk, gtk+3.0, pango 等 $COPIED_LIBS 个)"
    echo "  ✓ glibc 动态链接"
    echo "  ✓ 跨 Ubuntu/Debian 发行版运行"
    echo "  ✓ 单文件分发"
    echo ""
else
    echo ""
    echo "❌ 错误: AppImage 文件未生成"
    echo ""
    echo "故障排除:"
    echo "  1. 检查 AppDir 是否完整: ls -lh $APPDIR"
    echo "  2. 手动测试: $APPDIR/AppRun"
    echo "  3. 查看日志获取详细错误信息"
    echo ""
    exit 1
fi
