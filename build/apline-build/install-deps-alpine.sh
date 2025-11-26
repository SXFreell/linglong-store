#!/usr/bin/env bash
#
# install-deps-alpine.sh
# 在 Alpine 上安装 Rust + Tauri + GTK/WebKit 所需的系统依赖

set -e

echo "==> 更新 APK 包索引..."
apk update

echo "==> 安装基础构建工具..."
apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    build-base \
    gcc \
    g++ \
    make \
    cmake \
    pkgconfig \
    ca-certificates

echo "==> 安装 glibc（用于兼容性）..."
if ! [ -f "/usr/glibc-compat/lib/libc.so.6" ]; then
    echo "下载 glibc 包..."
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
    wget -q -O /tmp/glibc-2.35-r0.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r0/glibc-2.35-r0.apk
    wget -q -O /tmp/glibc-bin-2.35-r0.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r0/glibc-bin-2.35-r0.apk
    
    echo "安装 glibc..."
    apk add --force-overwrite --allow-untrusted /tmp/glibc-2.35-r0.apk /tmp/glibc-bin-2.35-r0.apk
    
    # 清理临时文件
    rm -f /tmp/glibc-*.apk
    
    echo "glibc 安装完成: $(/usr/glibc-compat/bin/ldd --version | head -n1)"
else
    echo "glibc 已安装: $(/usr/glibc-compat/bin/ldd --version | head -n1)"
fi

echo "==> 安装 Tauri 系统依赖（包含运行时库和开发库）..."
apk add --no-cache \
    webkit2gtk-4.1 \
    webkit2gtk-4.1-dev \
    gtk+3.0 \
    gtk+3.0-dev \
    cairo \
    cairo-dev \
    cairo-static \
    cairo-gobject \
    pango \
    pango-dev \
    gdk-pixbuf \
    gdk-pixbuf-dev \
    glib \
    glib-dev \
    glib-static \
    dbus \
    dbus-dev \
    dbus-libs \
    libsoup3 \
    libsoup3-dev \
    librsvg \
    librsvg-dev \
    openssl \
    openssl-dev \
    openssl-libs-static \
    eudev-libs \
    eudev-dev \
    libayatana-appindicator \
    libayatana-appindicator-dev \
    zlib \
    zlib-dev \
    zlib-static \
    harfbuzz \
    harfbuzz-dev \
    harfbuzz-static \
    at-spi2-core \
    at-spi2-core-dev \
    libx11 \
    libx11-dev \
    libxext \
    libxext-dev \
    libxfixes \
    libxfixes-dev \
    libxi \
    libxi-dev \
    libxrandr \
    libxrandr-dev \
    libxcursor \
    libxcursor-dev \
    libxdamage \
    libxdamage-dev \
    libxcomposite \
    libxcomposite-dev \
    libxinerama \
    libxinerama-dev \
    libxkbcommon \
    libxkbcommon-dev \
    wayland-libs-client \
    wayland-libs-cursor \
    wayland-libs-egl \
    wayland-dev \
    wayland-protocols \
    mesa \
    mesa-dev \
    mesa-gl \
    mesa-gles \
    libdrm \
    libdrm-dev \
    libepoxy \
    libepoxy-dev \
    freetype \
    freetype-dev \
    fontconfig \
    fontconfig-dev \
    fribidi \
    fribidi-dev \
    pixman \
    pixman-dev \
    libpng \
    libpng-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    libwebp \
    libwebp-dev \
    tiff \
    tiff-dev \
    libxml2 \
    libxml2-dev \
    xdg-utils

echo "==> 安装 Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source "$HOME/.cargo/env"
    echo "Rust 安装完成: $(rustc --version)"
else
    echo "Rust 已安装: $(rustc --version)"
fi

# 确保 Rust 环境变量生效
export PATH="$HOME/.cargo/bin:$PATH"

echo "==> 安装 Node.js..."
if ! command -v node &> /dev/null; then
    apk add --no-cache nodejs npm
    echo "Node.js 安装完成: $(node --version)"
else
    echo "Node.js 已安装: $(node --version)"
fi

echo "==> 安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    echo "pnpm 安装完成: $(pnpm --version)"
else
    echo "pnpm 已安装: $(pnpm --version)"
fi

echo "==> 验证安装..."
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: $(pnpm --version)"

echo "==> 安装 AppImage 打包工具..."
if [ ! -f "/usr/local/bin/appimagetool" ]; then
    echo "下载 appimagetool..."
    wget -q -O /tmp/appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x /tmp/appimagetool
    mv /tmp/appimagetool /usr/local/bin/appimagetool
    echo "appimagetool 安装完成"
else
    echo "appimagetool 已安装"
fi

echo "==> ✅ 所有依赖安装完成！"
echo ""
echo "使用方法："
echo "  1. 启用 Rust 环境: source \$HOME/.cargo/env"
echo "  2. 安装前端依赖: pnpm install"
echo "  3. 构建 AppImage: ./build/apline-build/build-with-appimage.sh"
echo ""
echo "构建策略："
echo "  ✓ 静态链接: zlib, harfbuzz, cairo, glib, openssl"
echo "  ✓ AppImage打包: webkit2gtk, gtk+3.0, pango, gdk-pixbuf 等"
echo "  ✓ glibc 2.35 兼容层"
echo ""
echo "最终产物: linglong-store-x86_64.AppImage (可跨发行版运行)"


