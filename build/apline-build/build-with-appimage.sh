#!/usr/bin/env bash
#
# build-with-appimage.sh
# 构建 Tauri 应用并打包为 AppImage（包含 WebKit 等依赖）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 构建产物目录
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/src-tauri/target/release"

echo "==> 项目目录: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# 确保 Rust 环境可用
if ! command -v rustc &> /dev/null; then
    echo "错误: Rust 未安装或未在 PATH 中"
    echo "请运行: source \$HOME/.cargo/env"
    exit 1
fi

# 清理旧的构建产物
echo "==> 清理旧的构建产物..."
rm -rf AppDir
rm -f linglong-store-*.AppImage

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "==> 安装前端依赖..."
    pnpm install
fi

# 构建 Tauri 应用
echo "==> 构建 Tauri 应用..."
pnpm build:pro

BINARY_PATH="$PROJECT_ROOT/src-tauri/target/x86_64-unknown-linux-musl/release/linglong-store"
if [ ! -f "$BINARY_PATH" ]; then
    echo "错误: 找不到编译后的二进制文件: $BINARY_PATH"
    exit 1
fi

echo "==> 二进制文件: $BINARY_PATH"
echo "==> 文件大小: $(du -h "$BINARY_PATH" | cut -f1)"

# 创建 AppDir 结构
APPDIR="$PROJECT_ROOT/AppDir"
echo "==> 创建 AppDir: $APPDIR"
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/lib"
mkdir -p "$APPDIR/usr/share/applications"
mkdir -p "$APPDIR/usr/share/icons/hicolor/256x256/apps"

# 复制二进制文件
echo "==> 复制二进制文件..."
cp "$BINARY_PATH" "$APPDIR/usr/bin/linglong-store"
strip "$APPDIR/usr/bin/linglong-store" 2>/dev/null || true

# 收集动态库依赖
echo "==> 收集动态库依赖..."
echo "注意: 以下库将静态链接（已包含在二进制中）："
echo "  - zlib, harfbuzz, cairo, glib, openssl"
echo ""
echo "以下库将动态链接（打包到 AppImage）："

collect_deps() {
    local binary="$1"
    local lib_dir="$2"
    local processed=()
    
    # 获取直接依赖
    local deps=$(ldd "$binary" 2>/dev/null | grep "=>" | awk '{print $3}' | grep -v "^$")
    
    for lib in $deps; do
        if [ -f "$lib" ]; then
            lib_name=$(basename "$lib")
            
            # 跳过已处理的
            if [[ " ${processed[@]} " =~ " ${lib_name} " ]]; then
                continue
            fi
            
            # 跳过系统基础库（musl libc 相关）
            case "$lib_name" in
                libc.musl-*.so*|ld-musl-*.so*)
                    echo "  [跳过] $lib_name (musl libc)"
                    ;;
                *)
                    if [ ! -f "$lib_dir/$lib_name" ]; then
                        echo "  [复制] $lib_name"
                        cp -L "$lib" "$lib_dir/"
                        processed+=("$lib_name")
                        # 递归收集此库的依赖
                        collect_deps "$lib" "$lib_dir"
                    fi
                    ;;
            esac
        fi
    done
}

collect_deps "$BINARY_PATH" "$APPDIR/usr/lib"

# 复制 WebKit 和 GTK 的关键数据文件
echo ""
echo "==> 复制 WebKit/GTK 数据文件..."

# WebKit 进程和资源
if [ -d "/usr/lib/webkit2gtk-4.1" ]; then
    echo "  - WebKit 进程文件"
    mkdir -p "$APPDIR/usr/lib/webkit2gtk-4.1"
    cp -r /usr/lib/webkit2gtk-4.1/* "$APPDIR/usr/lib/webkit2gtk-4.1/" 2>/dev/null || true
fi

# GDK Pixbuf 加载器
if [ -d "/usr/lib/gdk-pixbuf-2.0" ]; then
    echo "  - GDK Pixbuf 加载器"
    mkdir -p "$APPDIR/usr/lib/gdk-pixbuf-2.0"
    cp -r /usr/lib/gdk-pixbuf-2.0/* "$APPDIR/usr/lib/gdk-pixbuf-2.0/" 2>/dev/null || true
fi

# GIO 模块
if [ -d "/usr/lib/gio/modules" ]; then
    echo "  - GIO 模块"
    mkdir -p "$APPDIR/usr/lib/gio/modules"
    cp -r /usr/lib/gio/modules/* "$APPDIR/usr/lib/gio/modules/" 2>/dev/null || true
fi

# 创建 AppRun 启动脚本
echo ""
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

# 复制图标
ICON_SOURCE="$PROJECT_ROOT/icons/icon.png"
if [ -f "$ICON_SOURCE" ]; then
    echo "==> 复制图标..."
    cp "$ICON_SOURCE" "$APPDIR/linglong-store.png"
    cp "$ICON_SOURCE" "$APPDIR/usr/share/icons/hicolor/256x256/apps/linglong-store.png"
    ln -sf ../../linglong-store.png "$APPDIR/.DirIcon"
else
    echo "警告: 找不到图标文件: $ICON_SOURCE"
    echo "      将使用默认图标"
fi

# 创建必要的符号链接
ln -sf linglong-store.desktop "$APPDIR/usr/share/applications/linglong-store.desktop"

# 显示 AppDir 统计信息
echo ""
echo "==> AppDir 创建完成"
echo "目录: $APPDIR"
echo "大小: $(du -sh "$APPDIR" | cut -f1)"
echo "文件数: $(find "$APPDIR" -type f | wc -l)"

# 打包为 AppImage
echo ""
echo "==> 打包 AppImage..."
OUTPUT_FILE="$PROJECT_ROOT/linglong-store-x86_64.AppImage"

if command -v appimagetool &> /dev/null; then
    # 设置 ARCH 环境变量
    export ARCH=x86_64
    
    appimagetool "$APPDIR" "$OUTPUT_FILE"
    
    if [ -f "$OUTPUT_FILE" ]; then
        chmod +x "$OUTPUT_FILE"
        echo ""
        echo "==> ✅ 构建成功！"
        echo ""
        echo "输出文件: $OUTPUT_FILE"
        echo "文件大小: $(du -h "$OUTPUT_FILE" | cut -f1)"
        echo ""
        echo "运行命令: $OUTPUT_FILE"
        echo ""
        echo "特性："
        echo "  ✓ 静态链接: zlib, harfbuzz, cairo-static, glib-static, openssl"
        echo "  ✓ 内置依赖: webkit2gtk, gtk+3.0, pango, gdk-pixbuf 等"
        echo "  ✓ 跨发行版: 可在大多数 Linux 发行版上运行"
        echo "  ✓ 单文件: 无需安装，直接运行"
    else
        echo "错误: AppImage 打包失败"
        exit 1
    fi
else
    echo "警告: appimagetool 未安装"
    echo ""
    echo "AppDir 已创建: $APPDIR"
    echo "可以手动测试: $APPDIR/AppRun"
    echo ""
    echo "安装 appimagetool 后重新运行此脚本完成打包："
    echo "  wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    echo "  chmod +x appimagetool-x86_64.AppImage"
    echo "  sudo mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool"
fi
