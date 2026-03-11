use crate::services::executor;
use crate::services::install::{LLCliListItem, arch_to_string};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use tokio::time::sleep;

/// 运行中的玲珑应用信息（前端展示用）
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LinglongAppInfo {
    /// 稳定唯一键，等于 container_id
    pub id: String,
    /// 应用 ID（如 org.deepin.calculator）
    pub name: String,
    pub version: String,
    pub arch: String,
    pub channel: String,
    pub source: String,
    pub pid: String,
    pub container_id: String,
}

/// 解析 ll-cli ps 的文本输出，返回 (appId, containerId, pid) 三元组列表
fn parse_ps_output(stdout: &str) -> Vec<(String, String, String)> {
    stdout
        .lines()
        .skip(1) // 跳过表头
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                Some((
                    parts[0].to_string(),
                    parts[1].to_string(),
                    parts[2].to_string(),
                ))
            } else {
                None
            }
        })
        .collect()
}

/// 从 ll-cli list --json --type=all 输出构建 appId → LLCliListItem 查找表
fn build_list_map(stdout: &str) -> HashMap<String, LLCliListItem> {
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return HashMap::new();
    }
    match serde_json::from_str::<Vec<LLCliListItem>>(trimmed) {
        Ok(items) => items
            .into_iter()
            .filter_map(|item| {
                item.app_id.clone().map(|id| (id, item))
            })
            .collect(),
        Err(e) => {
            warn!("[build_list_map] Failed to parse ll-cli list output: {}", e);
            HashMap::new()
        }
    }
}

/// 提取 source：取 runtime 字段冒号前的部分（如 "stable:org.deepin.base/23.0.0"）
fn extract_source(runtime: Option<&String>) -> String {
    runtime
        .and_then(|r| r.split(':').next())
        .unwrap_or("")
        .to_string()
}

/// 获取正在运行的玲珑应用列表。
///
/// 优化策略：用 2 次外部命令（`ll-cli ps` + `ll-cli list --json --type=all`）
/// 替代原来的 1+N 次（1 次 ps + N 次 info），大幅降低查询延迟。
pub async fn get_running_linglong_apps() -> Result<Vec<LinglongAppInfo>, String> {
    // 1. 获取运行中进程列表
    let ps_stdout = executor::execute_or_err(&["ps"], "ps").await?;
    let running = parse_ps_output(&ps_stdout);

    if running.is_empty() {
        return Ok(Vec::new());
    }

    // 2. 批量获取已安装应用详情，构建查找表
    let list_map = match executor::execute(&["list", "--json", "--type=all"], "ps_list").await {
        Ok(output) if output.success => build_list_map(&output.stdout),
        _ => {
            warn!("[get_running_linglong_apps] ll-cli list failed, falling back to empty map");
            HashMap::new()
        }
    };

    // 3. 合并数据：用 list 详情补充 ps 行信息，找不到则降级填充
    let apps = running
        .into_iter()
        .map(|(app_id, container_id, pid)| {
            if let Some(item) = list_map.get(&app_id) {
                LinglongAppInfo {
                    id: container_id.clone(),
                    name: app_id,
                    version: item.version.clone(),
                    arch: arch_to_string(&item.arch),
                    channel: item.channel.clone(),
                    source: extract_source(item.runtime.as_ref()),
                    pid,
                    container_id,
                }
            } else {
                // 降级：list 中找不到此应用，仅用 ps 行内信息
                info!("[get_running_linglong_apps] app '{}' not found in list, using fallback", app_id);
                LinglongAppInfo {
                    id: container_id.clone(),
                    name: app_id,
                    version: String::new(),
                    arch: String::new(),
                    channel: String::new(),
                    source: String::new(),
                    pid,
                    container_id,
                }
            }
        })
        .collect();

    Ok(apps)
}

async fn is_app_running(app_id: &str) -> Result<bool, String> {
    let stdout = executor::execute_or_err(&["ps"], "is_app_running").await?;
    let running = parse_ps_output(&stdout);
    Ok(running.iter().any(|(name, _, _)| name == app_id))
}

pub async fn kill_linglong_app(app_name: String) -> Result<String, String> {
    // 尝试停止运行中的应用，最多 5 次，间隔 1 秒
    for attempt in 1..=5 {
        let running = is_app_running(&app_name).await?;
        if !running {
            info!("[kill_linglong_app] App not running, proceed: {}", app_name);
            return Ok(format!("Successfully stopped {}", app_name));
        }

        info!(
            "[kill_linglong_app] App is running, attempt {} to kill: {}",
            attempt, app_name
        );
        let kill_output = executor::execute(
            &["kill", "-s", "9", &app_name],
            "kill",
        ).await.map_err(|e| format!("Failed to execute 'll-cli kill': {}", e))?;

        let mut error_msg = kill_output.stderr.clone();
        if !kill_output.success {
            warn!(
                "[kill_linglong_app] kill attempt {} failed for {}: {}",
                attempt, app_name, error_msg
            );
        }

        if attempt == 5 {
            // 最后一轮后再检查一次，仍在运行则返回错误
            let still_running = is_app_running(&app_name).await.unwrap_or(true);
            if still_running {
                warn!("[kill_linglong_app] error_msg: {}", error_msg);
                if error_msg.is_empty() {
                    error_msg = "未知错误".to_string();
                }
                return Err(error_msg.to_string());
            }
            break;
        }

        sleep(Duration::from_secs(1)).await;
    }

    Ok(format!("Successfully stopped {}", app_name))
}
