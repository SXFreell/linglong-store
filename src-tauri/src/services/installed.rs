use serde::{Deserialize, Serialize};
use std::process::Command;

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
pub async fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    // 执行 ll-cli list --json 命令
    let output = Command::new("ll-cli")
        .arg("list")
        .arg("--json")
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli list --json': {}", e))?;

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

    // 转换为 InstalledApp 结构，只保留 kind 为 "app" 的应用
    let apps: Vec<InstalledApp> = list_items
        .into_iter()
        .filter(|item| {
            // 只保留 kind 为 "app" 的应用
            item.kind.as_ref().map_or(false, |k| k == "app")
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

/// 获取所有已安装应用（包括基础服务）
pub async fn get_all_installed_apps() -> Result<Vec<InstalledApp>, String> {
    // 执行 ll-cli list --json --type=all 命令
    let output = Command::new("ll-cli")
        .arg("list")
        .arg("--json")
        .arg("--type=all")
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli list --json --type=all': {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ll-cli list --type=all command failed: {}", error_msg));
    }

    let output_string = String::from_utf8_lossy(&output.stdout);
    let trimmed = output_string.trim();
    
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    // 解析 JSON 输出
    let list_items: Vec<LLCliListItem> = serde_json::from_str(trimmed)
        .map_err(|e| format!("Failed to parse ll-cli list output: {}", e))?;

    // 转换为 InstalledApp 结构，只保留 kind 为 "app" 的应用
    let apps: Vec<InstalledApp> = list_items
        .into_iter()
        .filter(|item| {
            // 只保留 kind 为 "app" 的应用
            item.kind.as_ref().map_or(false, |k| k == "app")
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

    Ok(apps)
}
