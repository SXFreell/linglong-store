//! 桌面集成
//!
//! 本模块负责创建/管理应用的桌面快捷方式。

use log::info;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;

use crate::services::executor;

use super::operations::get_installed_apps;

/// 为指定应用创建桌面快捷方式
///
/// 从 `ll-cli content` 获取 .desktop 文件路径，复制到用户桌面目录。
pub async fn create_desktop_shortcut(app_id: String) -> Result<String, String> {
    info!("[Shortcut] Creating desktop shortcut for app: {}", app_id);

    let installed_apps = get_installed_apps(false).await?;
    let is_installed = installed_apps.iter().any(|item| item.app_id == app_id);

    if !is_installed {
        return Err(format!("应用未安装，无法创建快捷方式: {}", app_id));
    }

    let stdout = executor::execute_or_err(&["content", &app_id], "content").await?;

    let desktop_source = stdout
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty() && line.ends_with(".desktop"))
        .map(PathBuf::from)
        .ok_or_else(|| format!("未找到应用导出的 desktop 文件: {}", app_id))?;

    let desktop_file_name = desktop_source
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| format!("desktop 文件名无效: {}", desktop_source.display()))?;

    let home_dir = std::env::var("HOME").map_err(|_| "无法获取 HOME 目录".to_string())?;
    let target_dir = PathBuf::from(home_dir).join("Desktop");

    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("创建目标目录失败 {}: {}", target_dir.display(), e))?;

    let target_path = target_dir.join(desktop_file_name);
    if target_path.exists() {
        return Err(format!(
            "快捷方式已存在，不会覆盖: {}",
            target_path.display()
        ));
    }

    fs::copy(&desktop_source, &target_path).map_err(|e| {
        format!(
            "复制 desktop 文件失败: {} -> {} ({})",
            desktop_source.display(),
            target_path.display(),
            e
        )
    })?;

    fs::set_permissions(&target_path, fs::Permissions::from_mode(0o755)).map_err(|e| {
        format!(
            "设置 desktop 文件权限失败: {} ({})",
            target_path.display(),
            e
        )
    })?;

    info!(
        "[Shortcut] Desktop shortcut created for {} at {}",
        app_id,
        target_path.display()
    );

    Ok(format!("已创建桌面快捷方式: {}", target_path.display()))
}
