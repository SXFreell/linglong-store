use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

/// 设置系统托盘
/// 
/// # 参数
/// * `app` - Tauri应用程序句柄
/// 
/// # 返回值
/// * `tauri::Result<()>` - 设置是否成功
pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    // 创建托盘菜单项
    let menu = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "show", "显示界面", true, None::<&str>)?,    // 显示窗口菜单项
            &MenuItem::with_id(app, "hidden", "隐藏界面", true, None::<&str>)?,  // 隐藏窗口菜单项
            &MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)?,        // 退出程序
        ],
    )?;
    // 创建系统托盘图标
    let _tray = TrayIconBuilder::new()
        .menu(&menu)  // 设置托盘菜单
        .on_menu_event(move |app, event| {  // 处理菜单点击事件
            // 获取主窗口实例
            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");
            // 根据菜单项ID执行相应操作
            match event.id.as_ref() {
                // 退出应用程序
                "quit" => app.exit(0),
                // 隐藏主窗口
                "hidden" => window.hide().expect("Failed to hide window"),
                // 显示主窗口
                "show" => {
                    window.show().expect("Failed to show window");
                }
                // 处理未知的菜单项
                _ => println!("Unhandled menu item: {:?}", event.id),
            }
        })
        // 设置托盘图标
        .icon(app.default_window_icon().unwrap().clone())
        // 构建托盘图标
        .build(app)?;
    
    Ok(())
}
