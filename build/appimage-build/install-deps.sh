#!/usr/bin/env bash
#
# install-deps-ubuntu.sh
# 在 Ubuntu 上安装 Rust + Tauri + GTK/WebKit 所需的系统依赖

set -e

echo "==> 更新 APT 包索引..."
apt-get update

echo "==> 安装基础构建工具..."
apt-get install -y \
    bash \
    curl \
    wget \
    git \
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    pkg-config \
    ca-certificates \
    fuse \
    libfuse2 \
    libfuse-dev \
    file

echo "==> 安装 Tauri 系统依赖（包含运行时库和开发库）..."
apt-get install -y \
    libwebkit2gtk-4.1-0 \
    libwebkit2gtk-4.1-dev \
    libgtk-3-0 \
    libgtk-3-dev \
    libcairo2 \
    libcairo2-dev \
    libcairo-gobject2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpango1.0-dev \
    libgdk-pixbuf-2.0-0 \
    libgdk-pixbuf2.0-dev \
    libglib2.0-0 \
    libglib2.0-dev \
    libdbus-1-3 \
    libdbus-1-dev \
    libsoup-3.0-0 \
    libsoup-3.0-dev \
    librsvg2-2 \
    librsvg2-dev \
    libssl-dev \
    libudev1 \
    libudev-dev \
    libayatana-appindicator3-1 \
    libayatana-appindicator3-dev \
    zlib1g \
    zlib1g-dev \
    libharfbuzz0b \
    libharfbuzz-dev \
    at-spi2-core \
    libatspi2.0-dev \
    libx11-6 \
    libx11-dev \
    libxext6 \
    libxext-dev \
    libxfixes3 \
    libxfixes-dev \
    libxi6 \
    libxi-dev \
    libxrandr2 \
    libxrandr-dev \
    libxcursor1 \
    libxcursor-dev \
    libxdamage1 \
    libxdamage-dev \
    libxcomposite1 \
    libxcomposite-dev \
    libxinerama1 \
    libxinerama-dev \
    libxkbcommon0 \
    libxkbcommon-dev \
    libwayland-client0 \
    libwayland-cursor0 \
    libwayland-egl1 \
    libwayland-dev \
    wayland-protocols \
    libgl1-mesa-glx \
    libgl1-mesa-dev \
    libgles2-mesa \
    libgles2-mesa-dev \
    libdrm2 \
    libdrm-dev \
    libepoxy0 \
    libepoxy-dev \
    libfreetype6 \
    libfreetype6-dev \
    libfontconfig1 \
    libfontconfig1-dev \
    libfribidi0 \
    libfribidi-dev \
    libpixman-1-0 \
    libpixman-1-dev \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libtiff-dev \
    libxml2 \
    libxml2-dev \
    xdg-utils

echo "==> 安装图像库运行时（使用开发包会自动安装对应的运行时库）..."
# 注意：开发包（-dev）会自动拉入对应的运行时库依赖

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
    # 安装 Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | -E bash -
    apt-get install -y nodejs
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
echo "  3. 构建 AppImage: ./build/ubuntu-build/build.sh"
echo ""
echo "构建策略："
echo "  ✓ 动态链接 glibc"
echo "  ✓ AppImage 打包: webkit2gtk, gtk+3.0, pango, gdk-pixbuf 等所有依赖"
echo "  ✓ 包含所有必要的动态库"
echo ""
echo "最终产物: linglong-store-x86_64.AppImage (可在 Ubuntu/Debian 系发行版运行)"


