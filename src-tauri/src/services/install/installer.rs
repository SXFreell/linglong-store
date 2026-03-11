//! 安装器核心逻辑
//!
//! 本模块实现玲珑应用安装的核心逻辑，包括：
//! - 安装流程管理
//! - 进程生命周期管理
//! - 取消操作处理
//!
//! 状态机模型（基于 ll-cli-json-install-gui-requirements.md）：
//! - IDLE -> WAITING: 启动安装
//! - WAITING -> INSTALLING: 收到进度百分比
//! - INSTALLING/WAITING -> FAILED: 收到错误/超时/进程异常退出
//! - INSTALLING -> SUCCEEDED: 进程正常退出 (exit code 0)

use log::{debug, error, info, trace, warn};
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tokio::io::AsyncBufReadExt;

use crate::services::ll_cli_async_command;

use super::json_parser::{JsonEventType, JsonLineParser};
use super::progress_emitter::{ProgressEmitter, ThreadSafeProgressEmitter};
use super::slot::InstallSlot;
use super::state_machine::InstallStateMachine;

/// 安装指定的玲珑应用
///
/// # Arguments
/// * `app_handle` - Tauri 应用句柄，用于发送进度事件
/// * `app_id` - 应用 ID（例如：org.deepin.calculator）
/// * `version` - 可选的版本号（如果为空，则安装最新版本）
/// * `force` - 是否强制安装
///
/// # Returns
/// * `Ok(String)` - 安装成功消息
/// * `Err(String)` - 安装失败原因
pub async fn install_linglong_app(
    app_handle: AppHandle,
    app_id: String,
    version: Option<String>,
    force: bool,
) -> Result<String, String> {
    info!("[Installer] START app_id={}, version={:?}, force={}", app_id, version, force);

    // 1. 尝试占用安装槽位
    InstallSlot::acquire(&app_id)?;

    // 创建进度发送器
    let emitter = ProgressEmitter::new(&app_handle, app_id.clone());

    // 2. 构建应用引用
    let app_ref = if let Some(ref ver) = version {
        format!("{}/{}", app_id, ver)
    } else {
        app_id.clone()
    };

    // 3. 构建异步命令
    let mut cmd = ll_cli_async_command();
    cmd.arg("install")
        .arg(&app_ref)
        .arg("--json")
        .arg("-y");

    if force {
        cmd.arg("--force");
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    info!(
        "[Installer] Executing: ll-cli install {} --json -y{}",
        app_ref,
        if force { " --force" } else { "" }
    );

    // 4. 启动子进程（异步 tokio::process）
    let mut child = match cmd.spawn() {
        Ok(child) => child,
        Err(e) => {
            let err_msg = format!("Failed to spawn ll-cli process: {}", e);
            error!("[Installer] {}", err_msg);
            InstallSlot::release();
            return Err(err_msg);
        }
    };

    debug!("[Installer] Process spawned");

    // 5. 获取 stdout（tokio::process::ChildStdout，实现 AsyncRead）
    let stdout = match child.stdout.take() {
        Some(stdout) => stdout,
        None => {
            let err_msg = "Failed to capture stdout".to_string();
            error!("[Installer] {}", err_msg);
            InstallSlot::release();
            return Err(err_msg);
        }
    };

    // 6. 初始化状态机
    let state_machine = Arc::new(Mutex::new(InstallStateMachine::new()));

    if let Ok(mut sm) = state_machine.lock() {
        sm.start();
    }

    // 7. 发送初始等待事件
    emitter.emit_waiting();

    // 8. 在 tokio 任务中异步读取 stdout（替代 std::thread::spawn）
    let thread_emitter = ThreadSafeProgressEmitter::new(app_handle.clone(), app_id.clone());
    let sm_reader = state_machine.clone();
    let last_error: Arc<Mutex<Option<(i32, String)>>> = Arc::new(Mutex::new(None));
    let last_error_clone = last_error.clone();

    let reader_handle = tokio::spawn(async move {
        let reader = tokio::io::BufReader::new(stdout);
        let mut lines = reader.lines();
        let mut last_percentage: u32 = 0;

        while let Ok(Some(line)) = lines.next_line().await {
            trace!("[Installer:Reader] Raw: {}", line);

            // 解析 JSON 行
            let event = match JsonLineParser::parse(&line) {
                Some(e) => e,
                None => continue,
            };

            debug!("[Installer:Reader] Event: {:?}", event);

            match event.event_type {
                JsonEventType::Progress => {
                    if let Ok(mut sm) = sm_reader.lock() {
                        sm.on_progress(event.percentage.unwrap_or(0.0));
                    }

                    let percentage = (event.percentage.unwrap_or(0.0) as u32).min(100);

                    // 只有百分比变化时才发送
                    if percentage != last_percentage {
                        last_percentage = percentage;
                        thread_emitter.emit_progress(percentage, &event.message);
                    }
                }
                JsonEventType::Error => {
                    if let Ok(mut sm) = sm_reader.lock() {
                        sm.on_error();
                    }

                    let code = event.code.unwrap_or(-1);

                    // 保存错误信息
                    if let Ok(mut last_err) = last_error_clone.lock() {
                        *last_err = Some((code, event.message.clone()));
                    }

                    thread_emitter.emit_error(code, &event.message);
                }
                JsonEventType::Message => {
                    if let Ok(mut sm) = sm_reader.lock() {
                        sm.touch();
                    }
                    thread_emitter.emit_message(&event.message, last_percentage);
                }
            }
        }

        debug!("[Installer:Reader] Finished reading stdout");
    });

    // 9. 异步等待进程结束，同时检查超时（替代同步轮询循环）
    let sm_timeout = state_machine.clone();
    let timeout_check = async {
        loop {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            let timed_out = sm_timeout
                .lock()
                .map(|sm| sm.check_timeout())
                .unwrap_or(false);
            if timed_out {
                return;
            }
        }
    };

    let exit_status;
    tokio::select! {
        result = child.wait() => {
            match result {
                Ok(status) => {
                    debug!("[Installer] Process exited: {:?}", status);
                    exit_status = status;
                }
                Err(e) => {
                    let err_msg = format!("Failed to wait for process: {}", e);
                    error!("[Installer] {}", err_msg);
                    InstallSlot::release();
                    return Err(err_msg);
                }
            }
        }
        _ = timeout_check => {
            warn!("[Installer] Progress timeout. Killing process...");
            let _ = child.kill().await;
            emitter.emit_timeout();
            InstallSlot::release();
            return Err("Installation timed out".to_string());
        }
    }

    // 10. 等待读取任务完成
    let _ = reader_handle.await;

    info!("[Installer] Process exited with status: {:?}", exit_status);

    // 11. 检查是否被用户取消
    let was_cancelled = InstallSlot::is_cancelled();

    // 12. 释放槽位（统一由安装方法释放）
    InstallSlot::release();

    // 13. 根据退出状态和取消标志判断结果
    if exit_status.success() {
        if let Ok(mut sm) = state_machine.lock() {
            sm.on_success();
        }

        let success_msg = if let Some(ver) = version {
            format!("Successfully installed {} version {}", app_id, ver)
        } else {
            format!("Successfully installed {}", app_id)
        };

        info!("[Installer] SUCCESS: {}", success_msg);
        emitter.emit_success();
        Ok(success_msg)
    } else if was_cancelled {
        info!("[Installer] Cancelled by user");
        Err("Installation cancelled by user".to_string())
    } else {
        // 真正的安装失败
        if let Ok(mut sm) = state_machine.lock() {
            sm.on_failure();
        }

        let (error_code, error_message) = if let Ok(last_err) = last_error.lock() {
            last_err.clone().unwrap_or((-1, "Unknown error".to_string()))
        } else {
            (-1, "Unknown error".to_string())
        };

        let failure_msg = format!("Installation failed: {}", error_message);

        error!("[Installer] FAILED: {}", failure_msg);
        emitter.emit_error(error_code, &error_message);
        Err(failure_msg)
    }
}

/// 取消正在进行的安装
///
/// 使用优雅终止方式（SIGTERM）杀死 ll-package-manager 和 ll-cli 进程。
///
/// # Arguments
/// * `app_handle` - Tauri 应用句柄，用于发送取消事件
/// * `app_id` - 应用 ID（保留参数以兼容前端调用）
///
/// # Returns
/// * `Ok(String)` - 取消成功消息
/// * `Err(String)` - 取消失败原因
pub async fn cancel_linglong_install(
    app_handle: AppHandle,
    app_id: String,
) -> Result<String, String> {
    info!("[Installer:Cancel] Cancelling installation for: {}", app_id);

    // 1. 先标记取消状态
    if !InstallSlot::mark_cancelled() {
        let err_msg = "没有正在进行的安装任务".to_string();
        warn!("[Installer:Cancel] {}", err_msg);
        return Err(err_msg);
    }

    // 2. 杀死安装进程
    info!("[Installer:Cancel] Executing: pkexec killall -15 ll-package-manager ll-cli");

    let _output = tokio::process::Command::new("pkexec")
        .arg("killall")
        .arg("-15") // SIGTERM 优雅终止
        .arg("ll-cli")
        .output()
        .await;

    // 3. 发送取消事件
    let emitter = ProgressEmitter::new(&app_handle, app_id);
    emitter.emit_cancelled();

    // 注意：不在这里释放槽位，由 install_linglong_app 统一释放

    let success_msg = "已取消安装".to_string();
    info!("[Installer:Cancel] {}", success_msg);
    Ok(success_msg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slot_integration() {
        // 确保槽位初始为空
        InstallSlot::release();
        assert!(InstallSlot::is_idle());

        // 模拟占用
        InstallSlot::acquire("test.app").unwrap();
        assert!(!InstallSlot::is_idle());

        // 模拟取消
        assert!(InstallSlot::mark_cancelled());
        assert!(InstallSlot::is_cancelled());

        // 释放
        InstallSlot::release();
        assert!(InstallSlot::is_idle());
    }
}
