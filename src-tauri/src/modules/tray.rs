use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

/// 创建系统托盘
/// 
/// # 返回值
/// * `SystemTray` - 系统托盘实例
pub fn create_system_tray() -> SystemTray {
    // 创建托盘菜单项
    let show = CustomMenuItem::new("show".to_string(), "显示界面");
    let hidden = CustomMenuItem::new("hidden".to_string(), "隐藏界面");
    let quit = CustomMenuItem::new("quit".to_string(), "退出程序");
    
    // 构建系统托盘菜单
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hidden)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    // 创建系统托盘
    SystemTray::new().with_menu(tray_menu)
}

/// 处理系统托盘事件
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            let window = app.get_window("main").expect("Failed to get main window");
            match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "hidden" => {
                    window.hide().expect("Failed to hide window");
                }
                "show" => {
                    window.show().expect("Failed to show window");
                    window.set_focus().expect("Failed to focus window");
                }
                _ => {}
            }
        }
        _ => {}
    }
}
