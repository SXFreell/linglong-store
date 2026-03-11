#!/bin/bash
# 龙芯架构 deb 打包脚本
# 使用方法: ./build-deb.sh [版本号]

set -e

# 配置
VERSION=${1:-"2.1.2"}
PACKAGE_NAME="linglong-store"
ARCH="loong64"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TAURI_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$TAURI_DIR/src-tauri/target"
DEB_TMP="$BUILD_DIR/deb-pkg"
DEB_OUTPUT="${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"

echo "=== 构建 ${PACKAGE_NAME} deb 包 ==="
echo "版本: $VERSION"
echo "架构: $ARCH"

# 检查二进制文件是否存在
BINARY="$BUILD_DIR/release/$PACKAGE_NAME"
if [ ! -f "$BINARY" ]; then
    echo "错误: 二进制文件不存在，请先运行 pnpm run build:pro"
    exit 1
fi

# 清理旧的打包目录
rm -rf "$DEB_TMP"

# 创建目录结构
mkdir -p "$DEB_TMP/DEBIAN" \
    "$DEB_TMP/usr/bin" \
    "$DEB_TMP/usr/share/applications" \
    "$DEB_TMP/usr/share/icons/hicolor/32x32/apps" \
    "$DEB_TMP/usr/share/icons/hicolor/128x128/apps" \
    "$DEB_TMP/usr/share/icons/hicolor/512x512/apps"

# 复制二进制文件
cp "$BINARY" "$DEB_TMP/usr/bin/"
echo "✓ 复制二进制文件"

# 复制图标
ICONS_DIR="$TAURI_DIR/src-tauri/icons"
cp "$ICONS_DIR/32x32.png" "$DEB_TMP/usr/share/icons/hicolor/32x32/apps/${PACKAGE_NAME}.png"
cp "$ICONS_DIR/128x128.png" "$DEB_TMP/usr/share/icons/hicolor/128x128/apps/${PACKAGE_NAME}.png"
cp "$ICONS_DIR/512x512.png" "$DEB_TMP/usr/share/icons/hicolor/512x512/apps/${PACKAGE_NAME}.png"
echo "✓ 复制图标文件"

# 创建 desktop 文件
cat > "$DEB_TMP/usr/share/applications/${PACKAGE_NAME}.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=玲珑应用商店社区版
Name[zh_CN]=玲珑应用商店社区版
GenericName=Application Store
GenericName[zh_CN]=应用商店
Comment=Linglong Application Store
Comment[zh_CN]=玲珑应用商店社区版 - 管理和安装玲珑应用
Exec=/usr/bin/${PACKAGE_NAME}
Icon=${PACKAGE_NAME}
StartupWMClass=${PACKAGE_NAME}
Terminal=false
Categories=System;PackageManager;
Keywords=linglong;store;app;package;
EOF
echo "✓ 创建 desktop 文件"

# 创建 control 文件
cat > "$DEB_TMP/DEBIAN/control" << EOF
Package: ${PACKAGE_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: Shirosu <xfreell@163.com>
Description: 玲珑应用商店社区版
 玲珑应用商店社区版 - 管理和安装玲珑应用
EOF

# 创建 postinst 脚本
cat > "$DEB_TMP/DEBIAN/postinst" << 'POSTINST'
#!/bin/bash
gtk-update-icon-cache -f /usr/share/icons/hicolor/ 2>/dev/null || true
POSTINST
chmod 755 "$DEB_TMP/DEBIAN/postinst"
echo "✓ 创建 control 文件"

# 构建 deb 包
cd "$BUILD_DIR"
dpkg-deb --build deb-pkg "$DEB_OUTPUT"
echo "✓ 构建 deb 包"

# 清理临时目录
rm -rf "$DEB_TMP"

echo ""
echo "=== 构建完成 ==="
echo "输出文件: $BUILD_DIR/$DEB_OUTPUT"
ls -lh "$BUILD_DIR/$DEB_OUTPUT"