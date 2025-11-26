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
        
        # 跳过 linux-vdso（虚拟库）
        case "$lib_name" in
            linux-vdso.so*)
                echo "${indent}[跳过] $lib_name (虚拟库)"
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

# 复制动态链接器（ld-linux）
echo ""
echo "==> 复制动态链接器..."
LD_LINUX=$(ldd "$APPDIR/usr/bin/linglong-store" 2>/dev/null | grep -oP '/lib.*/ld-linux.*\.so\.[0-9]+' | head -n1)
if [ -n "$LD_LINUX" ] && [ -f "$LD_LINUX" ]; then
    LD_NAME=$(basename "$LD_LINUX")
    mkdir -p "$APPDIR/lib/x86_64-linux-gnu"
    cp -L "$LD_LINUX" "$APPDIR/lib/x86_64-linux-gnu/$LD_NAME"
    echo "  ✓ 复制动态链接器: $LD_NAME"
    
    # 创建符号链接
    ln -sf "../lib/x86_64-linux-gnu/$LD_NAME" "$APPDIR/usr/lib/$LD_NAME"
fi

COPIED_LIBS=$(find "$APPDIR/usr/lib" -name "*.so*" | wc -l)
LIBS_SIZE=$(du -sh "$APPDIR/usr/lib" | cut -f1)
echo ""
echo "✓ 已复制 $COPIED_LIBS 个动态库（包含 glibc），总大小: $LIBS_SIZE"
echo ""

# 使用 patchelf 修改主程序的 rpath（如果可用）
if command -v patchelf &> /dev/null; then
    echo "==> 使用 patchelf 设置 RPATH..."
    patchelf --set-rpath '$ORIGIN/../lib' "$APPDIR/usr/bin/linglong-store" 2>/dev/null || true
    echo "✓ RPATH 已设置"
    echo ""
fi

# 复制 WebKit 和 GTK 的关键数据文件
echo "==> 复制 WebKit/GTK 数据文件..."

COPIED_DATA=0

# WebKit 进程和资源（尝试多个可能的路径）
WEBKIT_PATHS=(
    "/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1"
    "/usr/lib/webkit2gtk-4.1"
    "/usr/libexec/webkit2gtk-4.1"
)

WEBKIT_SOURCE_PATH=""
for webkit_path in "${WEBKIT_PATHS[@]}"; do
    if [ -d "$webkit_path" ]; then
        WEBKIT_SOURCE_PATH="$webkit_path"
        mkdir -p "$APPDIR/usr/lib/webkit2gtk-4.1"
        
        if cp -r "$webkit_path"/* "$APPDIR/usr/lib/webkit2gtk-4.1/" 2>/dev/null; then
            echo "  ✓ WebKit 进程文件 (来自 $webkit_path)"
            
            # 确保进程文件可执行
            chmod +x "$APPDIR/usr/lib/webkit2gtk-4.1"/* 2>/dev/null || true
            COPIED_DATA=$((COPIED_DATA + 1))
            
            # 收集 WebKit 进程的依赖
            echo "  → 收集 WebKit 进程依赖..."
            for webkit_proc in "$APPDIR/usr/lib/webkit2gtk-4.1"/*; do
                if [ -f "$webkit_proc" ] && [ -x "$webkit_proc" ]; then
                    proc_name=$(basename "$webkit_proc")
                    echo "    分析: $proc_name"
                    collect_deps "$webkit_proc" "$APPDIR/usr/lib" "      "
                fi
            done
            break
        fi
    fi
done

if [ $COPIED_DATA -eq 0 ]; then
    echo "  ⚠ 警告: 未找到 WebKit 进程文件"
fi
echo ""

# GDK Pixbuf 加载器（尝试多个路径）
GDK_PIXBUF_PATHS=(
    "/usr/lib/x86_64-linux-gnu/gdk-pixbuf-2.0"
    "/usr/lib/gdk-pixbuf-2.0"
)

for gdk_path in "${GDK_PIXBUF_PATHS[@]}"; do
    if [ -d "$gdk_path" ]; then
        mkdir -p "$APPDIR/usr/lib/gdk-pixbuf-2.0"
        if cp -r "$gdk_path"/* "$APPDIR/usr/lib/gdk-pixbuf-2.0/" 2>/dev/null; then
            echo "  ✓ GDK Pixbuf 加载器 (来自 $gdk_path)"
            COPIED_DATA=$((COPIED_DATA + 1))
            break
        fi
    fi
done

# GIO 模块（尝试多个路径）
GIO_PATHS=(
    "/usr/lib/x86_64-linux-gnu/gio/modules"
    "/usr/lib/gio/modules"
)

for gio_path in "${GIO_PATHS[@]}"; do
    if [ -d "$gio_path" ]; then
        mkdir -p "$APPDIR/usr/lib/gio/modules"
        if cp -r "$gio_path"/* "$APPDIR/usr/lib/gio/modules/" 2>/dev/null; then
            echo "  ✓ GIO 模块 (来自 $gio_path)"
            COPIED_DATA=$((COPIED_DATA + 1))
            break
        fi
    fi
done

# 复制 gconv 模块 (解决 glibc 字符集转换问题)
echo "==> 复制 gconv 模块..."
GCONV_PATHS=(
    "/usr/lib/x86_64-linux-gnu/gconv"
    "/usr/lib/gconv"
)

for gconv_path in "${GCONV_PATHS[@]}"; do
    if [ -d "$gconv_path" ]; then
        mkdir -p "$APPDIR/usr/lib/gconv"
        cp -r "$gconv_path"/* "$APPDIR/usr/lib/gconv/"
        echo "  ✓ gconv 模块 (来自 $gconv_path)"
        COPIED_DATA=$((COPIED_DATA + 1))
        break
    fi
done

# 补充缺失的依赖库 (libproxy, libgnutls 等)
echo "==> 补充缺失的依赖库..."
MISSING_LIBS=(
    "libproxy.so.1"
    "libgnutls.so.30"
    "libhogweed.so.6"
    "libnettle.so.8"
    "libgmp.so.10"
    "libayatana-appindicator3.so.1"
    "libappindicator3.so.1"
)

for lib in "${MISSING_LIBS[@]}"; do
    # 查找系统中的库
    found_lib=$(find /usr/lib -name "$lib" | head -n 1)
    if [ -n "$found_lib" ]; then
        if [ ! -f "$APPDIR/usr/lib/$lib" ]; then
            cp -L "$found_lib" "$APPDIR/usr/lib/"
            echo "  ✓ 补充依赖: $lib"
            # 递归收集依赖
            collect_deps "$found_lib" "$APPDIR/usr/lib" "    "
        fi
    else
        echo "  ⚠ 警告: 未找到 $lib"
    fi
done

# 重新统计动态库数量（包括 WebKit 进程的依赖）
FINAL_LIB_COUNT=$(find "$APPDIR/usr/lib" -name "*.so*" | wc -l)
FINAL_LIBS_SIZE=$(du -sh "$APPDIR/usr/lib" | cut -f1)
echo ""
echo "✓ 已复制 $COPIED_DATA 项数据文件"
echo "✓ 动态库总数: $FINAL_LIB_COUNT 个，总大小: $FINAL_LIBS_SIZE"
echo ""

# ==============================================================================
# 核心解决方案：RPATH 修复与 WebKit 路径补丁 (参考 linglong.yaml)
# ==============================================================================

# 1. 修复所有 ELF 文件的 RPATH
# ------------------------------------------------------------------------------
echo "==> 修复 RPATH..."
if ! command -v patchelf &> /dev/null; then
    echo "❌ 错误: patchelf 未安装，无法修复 RPATH"
    exit 1
fi

find "$APPDIR" -type f | while read -r file; do
    # 快速检查是否为 ELF 文件
    if ! head -c 4 "$file" | grep -q "ELF"; then
        continue
    fi
    
    # 跳过动态链接器
    if [[ "$(basename "$file")" == ld-linux* ]]; then
        continue
    fi

    # 计算相对 RPATH
    # 对于 bin/ 下的可执行文件，库在 ../lib
    # 对于 lib/ 下的库，库在 ./ (同级) 或 ../lib
    # 统一设置为 $ORIGIN/../lib:$ORIGIN/../lib/x86_64-linux-gnu:$ORIGIN
    
    NEW_RPATH='$ORIGIN/../lib:$ORIGIN/../lib/x86_64-linux-gnu:$ORIGIN'
    
    # 如果文件在 lib/ 下，可能需要调整 (虽然 $ORIGIN/../lib 通常也有效)
    # 但为了简单稳健，我们统一使用这个宽泛的 RPATH
    
    patchelf --set-rpath "$NEW_RPATH" "$file" 2>/dev/null || true
    # echo "  ✓ RPATH: $(basename "$file")"
done
echo "✓ 所有 ELF 文件的 RPATH 已修复"
echo ""

# 2. WebKitGTK 路径硬编码修复 (参考 linglong.yaml)
# ------------------------------------------------------------------------------
# 问题：libwebkit2gtk-4.1.so.0 硬编码了辅助进程路径 /usr/lib/x86_64-linux-gnu/webkit2gtk-4.1
# 方案：将其替换为 /tmp 下的一个固定长度路径，并在运行时创建软链接指向真实路径
echo "==> 应用 WebKitGTK 路径补丁..."

WEBKIT_LIB_NAME="libwebkit2gtk-4.1.so.0"
WEBKIT_LIB_PATH=$(find "$APPDIR" -name "$WEBKIT_LIB_NAME" | head -n 1)

if [ -f "$WEBKIT_LIB_PATH" ]; then
    # 原始硬编码路径
    SEARCH_STR="/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1"
    SEARCH_LEN=${#SEARCH_STR}
    
    # 生成替换路径 (必须等长)
    # 模板: /tmp/llstore-webkit-<随机字符>
    # 前缀: /tmp/llstore-webkit- (20 chars)
    # 剩余: SEARCH_LEN - 20
    
    PREFIX_STR="/tmp/llstore-webkit-"
    PREFIX_LEN=${#PREFIX_STR}
    SUFFIX_LEN=$((SEARCH_LEN - PREFIX_LEN))
    
    if [ $SUFFIX_LEN -gt 0 ]; then
        # 生成随机后缀
        SUFFIX=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w "$SUFFIX_LEN" | head -n 1)
        REPLACE_STR="${PREFIX_STR}${SUFFIX}"
        
        echo "  目标库: $WEBKIT_LIB_NAME"
        echo "  原始路径: $SEARCH_STR ($SEARCH_LEN chars)"
        echo "  替换路径: $REPLACE_STR (${#REPLACE_STR} chars)"
        
        if [ ${#REPLACE_STR} -ne $SEARCH_LEN ]; then
            echo "❌ 错误: 替换字符串长度不匹配！"
            exit 1
        fi
        
        # 执行二进制替换
        # 使用 sed -i -b (binary mode) 避免换行符问题，但标准 sed 可能不支持 -b
        # 使用 LC_ALL=C sed 确保字节级处理
        if grep -q "$SEARCH_STR" "$WEBKIT_LIB_PATH"; then
            LC_ALL=C sed -i "s|$SEARCH_STR|$REPLACE_STR|g" "$WEBKIT_LIB_PATH"
            echo "  ✓ 已替换硬编码路径"
            
            # 保存替换路径供 AppRun 使用
            echo "$REPLACE_STR" > "$APPDIR/.webkit_tmp_path"
        else
            echo "  ⚠ 警告: 在库中未找到硬编码路径，可能版本不同或已修补"
        fi
    else
        echo "❌ 错误: 路径过短，无法生成替换路径"
        exit 1
    fi
else
    echo "⚠ 警告: 未找到 $WEBKIT_LIB_NAME，跳过 WebKit 补丁"
fi
echo ""

# 创建 AppRun 启动脚本
echo "==> 创建 AppRun 启动脚本..."
cat > "$APPDIR/AppRun" << 'APPRUN_EOF'
#!/bin/bash
# AppRun - AppImage 启动脚本

# 获取 AppImage 挂载点的绝对路径
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export APPDIR="$HERE"

# 切换到 AppImage 根目录
cd "$HERE"

# ------------------------------------------------------------------------------
# WebKitGTK 运行时链接修复
# ------------------------------------------------------------------------------
if [ -f "$APPDIR/.webkit_tmp_path" ]; then
    WEBKIT_TMP_PATH=$(cat "$APPDIR/.webkit_tmp_path")
    WEBKIT_REAL_PATH="$APPDIR/usr/lib/webkit2gtk-4.1"
    
    if [ -d "$WEBKIT_REAL_PATH" ]; then
        # 清理可能存在的旧链接/目录
        rm -rf "$WEBKIT_TMP_PATH"
        
        # 创建指向真实路径的软链接
        # 注意：ln -s 目标 链接名
        ln -s "$WEBKIT_REAL_PATH" "$WEBKIT_TMP_PATH"
        
        # 退出时清理
        trap "rm -rf '$WEBKIT_TMP_PATH'" EXIT
        
        # echo "AppRun: Linked WebKit path $WEBKIT_TMP_PATH -> $WEBKIT_REAL_PATH"
    fi
fi

# ------------------------------------------------------------------------------
# 环境修复
# ------------------------------------------------------------------------------

# 修复 machine-id
if [ ! -f /etc/machine-id ] && [ ! -f /var/lib/dbus/machine-id ]; then
    MACHINE_ID_DIR="/tmp/.linglong-store-runtime-$(id -u)"
    mkdir -p "$MACHINE_ID_DIR"
    export DBUS_MACHINE_ID_FILE="$MACHINE_ID_DIR/machine-id"
    if [ ! -f "$DBUS_MACHINE_ID_FILE" ]; then
        dbus-uuidgen > "$DBUS_MACHINE_ID_FILE" 2>/dev/null || echo "1b4e29b0$(date +%s | md5sum | head -c 24)" > "$DBUS_MACHINE_ID_FILE"
    fi
fi

# 禁用 WebKit 沙箱 (必须)
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1

# 设置库路径
export LD_LIBRARY_PATH="$APPDIR/lib:$APPDIR/usr/lib:$APPDIR/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# 设置资源路径
export GDK_PIXBUF_MODULE_FILE="$APPDIR/usr/lib/gdk-pixbuf-2.0/2.10.0/loaders.cache"
export GIO_MODULE_DIR="$APPDIR/usr/lib/gio/modules"
export GCONV_PATH="$APPDIR/usr/lib/gconv"

# 启动应用
# 优先使用内置 ld-linux
LD_LINUX=$(find "$APPDIR" -name "ld-linux-x86-64.so.2" | head -n 1)
if [ -f "$LD_LINUX" ]; then
    exec "$LD_LINUX" --library-path "$LD_LIBRARY_PATH" "$APPDIR/usr/bin/linglong-store" "$@"
else
    exec "$APPDIR/usr/bin/linglong-store" "$@"
fi
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
    echo "  mv appimagetool-x86_64.AppImage /usr/local/bin/appimagetool"
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
    echo "  ✓ 包含 glibc 和动态链接器"
    echo "  ✓ 真正的跨发行版运行（不依赖系统 glibc 版本）"
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
