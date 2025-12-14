use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

pub use crate::services::install_task::InstallProgress;
use crate::services::install_task::InstallTask;
use crate::services::process::kill_linglong_app;
use crate::services::ll_cli_command;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub app_id: String,
    pub name: String,
    pub version: String,
    pub arch: String,
    pub channel: String,
    pub description: String,
    pub icon: String,
    pub kind: Option<String>,
    pub module: String,
    pub runtime: String,
    pub size: String,
    pub repo_name: String,
}
#[derive(Debug, Deserialize)]
struct LLCliListItem {
    #[serde(alias = "id", alias = "appid", alias = "appId")]
    app_id: Option<String>,
    name: String,
    version: String,
    arch: serde_json::Value, // 可能是字符串或数组
    channel: String,
    description: Option<String>,
    kind: Option<String>,
    module: Option<String>,
    runtime: Option<String>,
    size: Option<serde_json::Value>,
}
/// 获取已安装的玲珑应用列表
/// include_base_service: 是否包含基础服务
pub async fn get_installed_apps(include_base_service: bool) -> Result<Vec<InstalledApp>, String> {
    let mut cmd = ll_cli_command();
    cmd.arg("list").arg("--json");

    if include_base_service {
        cmd.arg("--type=all");
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli list': {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ll-cli list command failed: {}", error_msg));
    }
    let output_string = String::from_utf8_lossy(&output.stdout);
    let trimmed = output_string.trim();

    if trimmed.is_empty() {
        return Ok(Vec::new());
    }
    // 解析 JSON 输出
    let list_items: Vec<LLCliListItem> = serde_json::from_str(trimmed)
        .map_err(|e| format!("Failed to parse ll-cli list output: {}", e))?;
    
    // 转换为 InstalledApp 结构
    let apps: Vec<InstalledApp> = list_items
        .into_iter()
        .filter(|item| {
            if include_base_service {
                true
            } else {
                // 只保留 kind 为 "app" 的应用
                item.kind.as_ref().map_or(false, |k| k == "app")
            }
        })
        .map(|item| {
            // 处理 arch 字段，可能是字符串或数组
            let arch = match item.arch {
                serde_json::Value::String(s) => s,
                serde_json::Value::Array(arr) => {
                    arr.first()
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string()
                }
                _ => String::new(),
            };
            // 处理 size 字段
            let size = match item.size {
                Some(serde_json::Value::String(s)) => s,
                Some(serde_json::Value::Number(n)) => n.to_string(),
                _ => "0".to_string(),
            };
            InstalledApp {
                app_id: item.app_id.unwrap_or_else(|| item.name.clone()),
                name: item.name,
                version: item.version,
                arch,
                channel: item.channel,
                description: item.description.unwrap_or_default(),
                icon: String::new(), // 默认为空，后续从服务器获取
                kind: item.kind,
                module: item.module.unwrap_or_default(),
                runtime: item.runtime.unwrap_or_default(),
                size,
                repo_name: "stable".to_string(), // 默认仓库
            }
        })
        .collect();
    Ok(apps)
}

/// 卸载指定的玲珑应用
pub async fn uninstall_linglong_app(app_id: String, version: String) -> Result<String, String> {
    info!("[uninstall_linglong_app] Checking and stopping app before uninstall: {}", app_id);

    // 尝试停止运行中的应用（kill_linglong_app 内部已包含重试逻辑）
    if let Err(err) = kill_linglong_app(app_id.clone()).await {
        warn!("[uninstall_linglong_app] Failed to stop app {}: {}", app_id, err);
        return Err(format!("卸载失败，请先停止应用运行。详情: {}", err));
    }

    info!("[uninstall_linglong_app] App stopped successfully, proceeding to uninstall: {}", app_id);

    let app_ref = format!("{}/{}", app_id, version);

    let output = ll_cli_command()
        .arg("uninstall")
        .arg(&app_ref)
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli uninstall': {}", e))?;
    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ll-cli uninstall command failed: {}", error_msg));
    }
    Ok(format!("Successfully uninstalled {} version {}", app_id, version))
}
/// 搜索指定appId的所有已安装版本
pub async fn search_app_versions(app_id: String) -> Result<Vec<InstalledApp>, String> {
    info!("[search_app_versions] Searching for installed versions of app_id: {}", app_id);

    // 使用 ll-cli list 获取所有已安装的应用
    let output = ll_cli_command()
        .arg("list")
        .arg("--json")
        .arg("--type=all")
        .output()
        .map_err(|e| {
            let err_msg = format!("Failed to execute 'll-cli list': {}", e);
            error!("[search_app_versions] Error: {}", err_msg);
            err_msg
        })?;
    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        let err = format!("ll-cli list command failed: {}", error_msg);
        error!("[search_app_versions] {}", err);
        return Err(err);
    }
    let output_string = String::from_utf8_lossy(&output.stdout);
    let trimmed = output_string.trim();

    info!("[search_app_versions] Output length: {} bytes", trimmed.len());

    if trimmed.is_empty() {
        warn!("[search_app_versions] Empty output, returning empty vec");
        return Ok(Vec::new());
    }
    // 解析 JSON 输出
    let list_items: Vec<LLCliListItem> = serde_json::from_str(trimmed)
        .map_err(|e| {
            let err_msg = format!("Failed to parse ll-cli list output: {}", e);
            error!("[search_app_versions] Parse error: {}", err_msg);
            err_msg
        })?;

    info!("[search_app_versions] Found {} installed items", list_items.len());

    // 过滤出指定 app_id 的所有版本
    let apps: Vec<InstalledApp> = list_items
        .into_iter()
        .filter(|item| {
            // 匹配 app_id 或 name
            let matches = item.app_id.as_ref().map_or(false, |id| id == &app_id)
                || item.name == app_id;
            if matches {
                info!(
                    "[search_app_versions] Found matching app: {} ({})",
                    item.name,
                    item.app_id.as_ref().unwrap_or(&item.name)
                );
            }
            matches
        })
        .map(|item| {
            let arch = match item.arch {
                serde_json::Value::String(s) => s,
                serde_json::Value::Array(arr) => {
                    arr.first()
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string()
                }
                _ => String::new(),
            };
            let size = match item.size {
                Some(serde_json::Value::String(s)) => s,
                Some(serde_json::Value::Number(n)) => n.to_string(),
                _ => "0".to_string(),
            };
            InstalledApp {
                app_id: item.app_id.unwrap_or_else(|| item.name.clone()),
                name: item.name,
                version: item.version,
                arch,
                channel: item.channel,
                description: item.description.unwrap_or_default(),
                icon: String::new(),
                kind: item.kind,
                module: item.module.unwrap_or_default(),
                runtime: item.runtime.unwrap_or_default(),
                size,
                repo_name: "stable".to_string(),
    }
        })
        .collect();
    info!("[search_app_versions] Found {} installed versions for app_id: {}", apps.len(), app_id);
    for app in &apps {
        info!(
            "[search_app_versions] - {} version: {}, channel: {}, module: {}",
            app.app_id, app.version, app.channel, app.module
        );
    }
    Ok(apps)
}
/// 运行指定的玲珑应用
pub async fn run_linglong_app(app_id: String) -> Result<String, String> {
    // 根据 ll-cli 文档，run 命令只需要应用名，不需要版本号
    // 示例：ll-cli run org.deepin.calculator

    info!("[run_linglong_app] Starting app: {}", app_id);
    info!("[run_linglong_app] Command: ll-cli run {}", app_id);

    // 在后台线程中启动命令，不等待退出
    let app_id_bg = app_id.clone();
    std::thread::spawn(move || {
        info!("[run_linglong_app][bg] Spawning ll-cli run {}", app_id_bg);
        let mut cmd = ll_cli_command();
        let spawn_result = cmd
            .arg("run")
            .arg(&app_id_bg)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn();
        match spawn_result
        {
            Ok(child) => {
                info!(
                    "[run_linglong_app][bg] Process spawned with PID: {:?}",
                    child.id()
                );
                // 不 wait，线程结束后让子进程自行运行
            }
            Err(e) => {
                error!(
                    "[run_linglong_app][bg] Failed to execute 'll-cli run' for {}: {}",
                    app_id_bg, e
                );
            }
        }
    });

    // 立即返回，不等待后台线程/子进程结束
    Ok(format!("Successfully launched {}", app_id))
}

/// 安装指定的玲珑应用（支持进度回调）
/// 参数说明：
/// - app_handle: Tauri 应用句柄，用于发送进度事件
/// - app_id: 应用 ID（例如：org.deepin.calculator）
/// - version: 可选的版本号（如果为空，则安装最新版本）
/// - force: 是否强制安装
pub async fn install_linglong_app(
        app_handle: AppHandle,
        app_id: String,
        version: Option<String>,
        force: bool,
) -> Result<String, String> {
    info!("========== [install_linglong_app] START ==========");
    let task = InstallTask::new(app_handle, app_id, version, force);
    task.execute()
}
