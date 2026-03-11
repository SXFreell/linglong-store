//! 统一的 ll-cli 命令执行器
//!
//! 封装异步命令执行、退出码检查、stdout/stderr 提取、统一 timeout，
//! 减少各 service 的重复模板代码。

use log::{info, warn};
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

use super::ENGLISH_LOCALE_ENV;

/// 命令执行默认超时时间（30 秒）
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// 命令执行结果
pub struct CliOutput {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
    pub status_code: Option<i32>,
}

/// 异步执行 ll-cli 命令并统一处理输出
///
/// 使用 tokio::process::Command 避免阻塞 async 运行时，
/// 并对所有命令施加统一的 timeout 策略。
///
/// # Arguments
/// * `args` - 命令参数列表
/// * `label` - 日志标签，用于定位调用来源
///
/// # Returns
/// * `Ok(CliOutput)` - 命令执行完成（无论成功与否）
/// * `Err(String)` - 命令无法启动或超时
pub async fn execute(args: &[&str], label: &str) -> Result<CliOutput, String> {
    execute_with_timeout(args, label, DEFAULT_TIMEOUT).await
}

/// 异步执行 ll-cli 命令，支持自定义超时时间
pub async fn execute_with_timeout(
    args: &[&str],
    label: &str,
    dur: Duration,
) -> Result<CliOutput, String> {
    let mut cmd = Command::new("ll-cli");
    // 应用英文 locale 环境变量，确保输出可解析
    for (key, value) in ENGLISH_LOCALE_ENV {
        cmd.env(key, value);
    }
    for arg in args {
        cmd.arg(arg);
    }

    info!("[ll-cli:{}] executing: ll-cli {}", label, args.join(" "));

    let output = timeout(dur, cmd.output())
        .await
        .map_err(|_| format!("[ll-cli:{}] 执行超时 ({}s)", label, dur.as_secs()))?
        .map_err(|e| format!("[ll-cli:{}] 启动失败: {}", label, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() && !stderr.is_empty() {
        warn!("[ll-cli:{}] stderr: {}", label, stderr.trim());
    }

    Ok(CliOutput {
        stdout,
        stderr,
        success: output.status.success(),
        status_code: output.status.code(),
    })
}

/// 异步执行 ll-cli 命令，失败时直接返回 Err
///
/// 适用于大多数场景：命令执行失败 = 业务失败
///
/// # Arguments
/// * `args` - 命令参数列表
/// * `label` - 日志标签
///
/// # Returns
/// * `Ok(String)` - stdout 内容
/// * `Err(String)` - 命令启动失败、超时或退出码非零时的 stderr
pub async fn execute_or_err(args: &[&str], label: &str) -> Result<String, String> {
    let output = execute(args, label).await?;

    if !output.success {
        let err_msg = if output.stderr.trim().is_empty() {
            format!("ll-cli {} 执行失败 (code={:?})", args.join(" "), output.status_code)
        } else {
            output.stderr.trim().to_string()
        };
        return Err(err_msg);
    }

    Ok(output.stdout)
}
