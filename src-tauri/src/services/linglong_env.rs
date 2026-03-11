use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tokio::process::Command as AsyncCommand;
use crate::services::executor;
use crate::services::linglong_env_parser::{
    parse_repo_output, parse_ll_version, parse_glibc_version, compare_versions,
};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LinglongRepo {
    pub name: String,
    pub url: String,
    pub alias: Option<String>,
    pub priority: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LinglongEnvCheckResult {
    pub ok: bool,
    pub reason: Option<String>,
    pub arch: Option<String>,
    pub os_version: Option<String>,
    pub glibc_version: Option<String>,
    pub kernel_info: Option<String>,
    pub detail_msg: Option<String>,
    pub ll_version: Option<String>,
    pub ll_bin_version: Option<String>,
    pub repo_name: Option<String>,
    pub repos: Vec<LinglongRepo>,
    pub is_container: bool,
}

pub async fn get_ll_cli_version() -> Result<String, String> {
    let output = executor::execute(&["--json", "--version"], "version").await?;

    if output.success {
        if let Some(v) = parse_ll_version(&output.stdout) {
            return Ok(v);
        }
    }

    Err("无法解析玲珑版本，请确认 ll-cli 可用".to_string())
}

pub async fn check_linglong_env(min_version: &str) -> Result<LinglongEnvCheckResult, String> {
    let mut result = LinglongEnvCheckResult::default();

    // 获取架构
    if let Ok(output) = AsyncCommand::new("uname").arg("-m").output().await {
        if output.status.success() {
            result.arch = Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
    }

    // 获取 OS 信息
    let os_release = fs::read_to_string("/etc/os-release")
        .ok()
        .and_then(|content| {
            content
                .lines()
                .find(|line| line.starts_with("PRETTY_NAME"))
                .and_then(|line| line.split('=').nth(1))
                .map(|v| v.trim_matches('"').to_string())
        });
    if let Some(name) = os_release {
        result.os_version = Some(name);
    } else if let Ok(output) = AsyncCommand::new("uname").arg("-a").output().await {
        if output.status.success() {
            result.os_version = Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
    }

    // 获取 glibc 版本（ldd --version）
    let glibc_version = AsyncCommand::new("ldd")
        .arg("--version")
        .output()
        .await
        .ok()
        .and_then(|output| {
            if !output.status.success() {
                return None;
            }
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            parse_glibc_version(&stdout).or_else(|| parse_glibc_version(&stderr))
        })
        .unwrap_or_else(|| "N/A".to_string());
    result.glibc_version = Some(glibc_version.clone());

    // 获取内核信息（uname -a）
    let kernel_info = AsyncCommand::new("uname")
        .arg("-a")
        .output()
        .await
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "N/A".to_string());
    result.kernel_info = Some(kernel_info.clone());
    if result.os_version.is_none() && kernel_info != "N/A" {
        result.os_version = Some(kernel_info);
    }

    // dpkg 信息（仅作为日志展示）
    if let Ok(output) = AsyncCommand::new("bash")
        .arg("-c")
        .arg("dpkg -l | grep linglong")
        .output()
        .await
    {
        if output.status.success() {
            result.detail_msg = Some(String::from_utf8_lossy(&output.stdout).to_string());
        }
    }

    // 检查 ll-cli 是否存在
    let exists = executor::execute(&["--help"], "env_check_help").await;
    if exists.is_err() || !exists.as_ref().unwrap().success {
        result.ok = false;
        result.reason = Some("检测到系统未安装玲珑环境，请先安装".to_string());
        return Ok(result);
    }

    // 仓库信息
    let repo_output = executor::execute(&["--json", "repo", "show"], "env_repo").await;
    let mut repo_info = LinglongEnvCheckResult::default();
    if let Ok(output) = repo_output {
        if output.success {
            if let Ok(json) = serde_json::from_str::<HashMap<String, serde_json::Value>>(&output.stdout) {
                let repo_name = json
                    .get("defaultRepo")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                let repos = json
                    .get("repos")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|item| {
                                Some(LinglongRepo {
                                    name: item.get("name")?.as_str().unwrap_or("").to_string(),
                                    url: item.get("url")?.as_str().unwrap_or("").to_string(),
                                    alias: item.get("alias").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                    priority: item.get("priority").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                })
                            })
                            .collect::<Vec<_>>()
                    })
                    .unwrap_or_default();
                repo_info.repo_name = repo_name;
                repo_info.repos = repos;
            } else {
                repo_info = parse_repo_output(&output.stdout);
            }
        } else {
            // 尝试旧命令
            if let Ok(fallback) = executor::execute(&["repo", "show"], "env_repo_fallback").await {
                if fallback.success {
                    repo_info = parse_repo_output(&fallback.stdout);
                }
            }
        }
    }
    if repo_info.repos.is_empty() {
        result.ok = false;
        result.reason = Some("未检测到玲珑仓库配置，请检查环境".to_string());
        return Ok(result);
    }
    result.repo_name = repo_info.repo_name.clone();
    result.repos = repo_info.repos.clone();

    // 获取 ll-cli 版本
    let version = get_ll_cli_version().await.ok();
    result.ll_version = version.clone();

    // 获取 linglong-bin 版本（APT 系）
    if let Ok(output) = AsyncCommand::new("apt-cache")
        .arg("policy")
        .arg("linglong-bin")
        .output()
        .await
    {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("Installed:") || line.contains("已安装：") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if let Some(v) = parts.get(1) {
                        result.ll_bin_version = Some(v.trim().to_string());
                    }
                }
            }
        }
    }

    // 版本校验：版本过低时仅警告，不阻止使用
    if let Some(ref v) = result.ll_version {
        if compare_versions(v, min_version) == std::cmp::Ordering::Less {
            // 不设置 ok=false，允许用户继续使用
            result.reason = Some(format!(
                "当前玲珑基础环境版本({})过低，建议升级至 >= {}",
                v, min_version
            ));
            // 注意：这里不再 return，继续后续检查
        }
    } else {
        result.ok = false;
        result.reason = Some("无法检测到玲珑环境版本，请确认已安装".to_string());
        return Ok(result);
    }

    // 检测容器环境变量
    result.is_container = std::env::var("LINYAPS_CONTAINER")
        .map(|v| v == "yes")
        .unwrap_or(false);

    result.ok = true;
    Ok(result)
}
