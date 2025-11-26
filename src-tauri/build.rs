fn main() {
    // 设置 Tauri 构建配置
    tauri_build::try_build(tauri_build::Attributes::new())
        .expect("failed to run tauri build");
}
