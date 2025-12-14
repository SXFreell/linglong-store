use log::{error, info, warn};
use once_cell::sync::Lazy;
use portable_pty::{
    native_pty_system, Child, CommandBuilder, ExitStatus, MasterPty, PtyPair, PtySize,
};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;
use tauri::{AppHandle, Emitter};

use crate::services::ll_cli_pty_command;

/// Global registry of install processes so future features (cancel/interrupt) can find and stop them.
/// The value is the PTY-backed child process guarded by Arc<Mutex<...>> for shared ownership.
pub static INSTALL_PROCESSES: Lazy<
    Arc<Mutex<HashMap<String, Arc<Mutex<Box<dyn Child + Send + Sync>>>>>>,
> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Payload emitted to the frontend for install progress updates.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub app_id: String,
    pub progress: String,   // Raw CLI progress text
    pub percentage: u32,    // 0-100
    pub status: String,     // Human readable status
}

/// Coordinates a single `ll-cli install` run: spawn, read PTY output, parse progress,
/// emit events, enforce timeouts, and clean up shared state.
pub(crate) struct InstallTask {
    app_handle: AppHandle,
    app_id: String,
    app_ref: String,
    version: Option<String>,
    force: bool,
    force_hint_detected: Arc<AtomicBool>,
    force_hint_message: Arc<Mutex<Option<String>>>,
    last_cli_message: Arc<Mutex<Option<String>>>,
    auth_wait_start: Arc<Mutex<Option<Instant>>>,
    auto_confirm_sent: Arc<AtomicBool>,
}

impl InstallTask {
    pub(crate) fn new(app_handle: AppHandle, app_id: String, version: Option<String>, force: bool) -> Self {
        let app_ref = version
            .as_ref()
            .map(|ver| format!("{}/{}", app_id, ver))
            .unwrap_or_else(|| app_id.clone());

        Self {
            app_handle,
            app_id,
            app_ref,
            version,
            force,
            force_hint_detected: Arc::new(AtomicBool::new(false)),
            force_hint_message: Arc::new(Mutex::new(None::<String>)),
            last_cli_message: Arc::new(Mutex::new(None::<String>)),
            auth_wait_start: Arc::new(Mutex::new(None::<Instant>)),
            auto_confirm_sent: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Entry point to run install end-to-end.
    pub(crate) fn execute(self) -> Result<String, String> {
        info!("[install_linglong_app] app_id: {}", self.app_id);
        info!("[install_linglong_app] version: {:?}", self.version);
        info!("[install_linglong_app] force: {}", self.force);
        info!("[install_linglong_app] Executing command: {}", self.command_string());

        let mut reader_handle: Option<thread::JoinHandle<()>> = None;
        let mut run_result: Result<ExitStatus, String>;

        {
            let pty_pair = self.open_pty()?;
            let child = self.spawn_install_process(&pty_pair)?;
            self.register_process(child.clone())?;
            reader_handle = Some(self.start_output_reader(pty_pair.master));
            run_result = self.wait_for_completion(child);
        }

        self.unregister_process();

        if let Some(handle) = reader_handle {
            let _ = handle.join();
        }

        let exit_status = run_result?;
        let result = self.handle_exit(exit_status);
        info!("========== [install_linglong_app] END ==========");
        result
    }

    fn command_string(&self) -> String {
        format!(
            "ll-cli install {} -y{}",
            self.app_ref,
            if self.force { " --force" } else { "" }
        )
    }

    fn build_command(&self) -> CommandBuilder {
        let mut cmd = ll_cli_pty_command();
        cmd.arg("install");
        cmd.arg(&self.app_ref);
        cmd.arg("-y");
        if self.force {
            cmd.arg("--force");
        }
        cmd
    }

    /// Create PTY to trick ll-cli into interactive mode and capture progress output.
    fn open_pty(&self) -> Result<PtyPair, String> {
        native_pty_system()
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| {
                let err_msg = format!("Failed to create PTY: {}", e);
                error!("[install_linglong_app] ERROR: {}", err_msg);
                err_msg
            })
    }

    fn spawn_install_process(
        &self,
        pty_pair: &PtyPair,
    ) -> Result<Arc<Mutex<Box<dyn Child + Send + Sync>>>, String> {
        let child = pty_pair.slave.spawn_command(self.build_command()).map_err(|e| {
            let err_msg = format!("Failed to spawn command in PTY: {}", e);
            error!("[install_linglong_app] ERROR: {}", err_msg);
            err_msg
        })?;

        info!("[install_linglong_app] Process spawned in PTY successfully");
        Ok(Arc::new(Mutex::new(child)))
    }

    /// Register process so other components (e.g., future cancel) can find it.
    fn register_process(
        &self,
        child_arc: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
    ) -> Result<(), String> {
        let mut processes = INSTALL_PROCESSES
            .lock()
            .map_err(|e| format!("Failed to lock process manager: {}", e))?;

        info!(
            "[install_linglong_app] About to store process with app_id: '{}'",
            self.app_id
        );
        info!(
            "[install_linglong_app] Current processes before insert: {}",
            processes.len()
        );

        processes.insert(self.app_id.clone(), child_arc);

        info!("[install_linglong_app] Process stored successfully");
        info!(
            "[install_linglong_app] Current processes after insert: {}",
            processes.len()
        );
        info!("[install_linglong_app] All stored app_ids:");
        for key in processes.keys() {
            info!("[install_linglong_app]   - '{}'", key);
        }

        Ok(())
    }

    /// Remove process from registry regardless of outcome.
    fn unregister_process(&self) {
        match INSTALL_PROCESSES.lock() {
            Ok(mut processes) => {
                processes.remove(&self.app_id);
                info!(
                    "[install_linglong_app] Process removed from manager for app: {}",
                    self.app_id
                );
            }
            Err(e) => {
                warn!(
                    "[install_linglong_app] WARN: Failed to lock process manager for cleanup: {}",
                    e
                );
            }
        }
    }

    /// Start PTY reader thread: parse progress lines, auto-confirm prompts, and emit events.
    fn start_output_reader(
        &self,
        mut master: Box<dyn MasterPty + Send + 'static>,
    ) -> thread::JoinHandle<()> {
        let app_id = self.app_id.clone();
        let app_handle = self.app_handle.clone();
        let force_hint_detected_reader = self.force_hint_detected.clone();
        let force_hint_message_reader = self.force_hint_message.clone();
        let last_cli_message_reader = self.last_cli_message.clone();
        let auth_wait_start_reader = self.auth_wait_start.clone();
        let auto_confirm_sent_reader = self.auto_confirm_sent.clone();

        thread::spawn(move || {
            let mut buffer = [0u8; 8192];
            let mut line_buffer = String::new();
            let mut last_percentage = 0u32;

            let mut reader = match master.try_clone_reader() {
                Ok(reader) => reader,
                Err(e) => {
                    error!("[install_linglong_app] ERROR: Failed to clone PTY reader: {}", e);
                    return;
                }
            };

            info!("[install_linglong_app] Starting to read PTY output...");
            info!("==========================================================");

            let pty_writer = match master.take_writer() {
                Ok(writer) => Some(Arc::new(Mutex::new(writer))),
                Err(e) => {
                    warn!("[install_linglong_app] WARN: Failed to take PTY writer: {}", e);
                    None
                }
            };

            let record_cli_output = |text: &str| {
                let trimmed_line = text.trim();
                if trimmed_line.is_empty() {
                    return;
                }

                if !trimmed_line.contains('%') {
                    if let Ok(mut last_line_guard) = last_cli_message_reader.lock() {
                        *last_line_guard = Some(trimmed_line.to_string());
                    }
                }

                if trimmed_line.contains("ll-cli install") && trimmed_line.contains("--force") {
                    force_hint_detected_reader.store(true, Ordering::Relaxed);
                    if let Ok(mut msg_guard) = force_hint_message_reader.lock() {
                        if msg_guard.is_none() {
                            *msg_guard = Some(trimmed_line.to_string());
                        }
                    }
                }

                let lower = trimmed_line.to_ascii_lowercase();
                if !auto_confirm_sent_reader.load(Ordering::Relaxed)
                    && (lower.contains("available actions") || lower.contains("your choice"))
                {
                    if let Some(writer) = &pty_writer {
                        if let Ok(mut guard) = writer.lock() {
                            if let Err(e) = guard.write_all(b"Yes\n") {
                                warn!("[PTY Writer] WARN: failed to write auto confirm: {}", e);
                            } else if let Err(e) = guard.flush() {
                                warn!("[PTY Writer] WARN: failed to flush auto confirm: {}", e);
                            } else {
                                info!("[PTY Writer] Auto-confirmed prompt with 'Yes'");
                                auto_confirm_sent_reader.store(true, Ordering::Relaxed);
                            }
                        }
                    }
                }
            };

            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        info!("[PTY Reader] EOF reached");
                        break;
                    }
                    Ok(n) => {
                        let text = String::from_utf8_lossy(&buffer[..n]);
                        line_buffer.push_str(&text);

                        while let Some(newline_pos) = line_buffer.find('\n') {
                            let line = line_buffer[..newline_pos].to_string();
                            line_buffer = line_buffer[newline_pos + 1..].to_string();

                            if !line.trim().is_empty() {
                                record_cli_output(&line);
                                let progress_info = parse_install_progress(&line, &app_id);

                                if let Ok(mut auth_guard) = auth_wait_start_reader.lock() {
                                    if progress_info.status == "等待授权" {
                                        if auth_guard.is_none() {
                                            info!("[PTY] Detected auth request, starting timer");
                                            *auth_guard = Some(Instant::now());
                                        }
                                    } else if !progress_info.status.is_empty()
                                        && progress_info.status != "正在处理"
                                    {
                                        if auth_guard.is_some() {
                                            info!(
                                                "[PTY] Auth state cleared, status: {}",
                                                progress_info.status
                                            );
                                            *auth_guard = None;
                                        }
                                    }
                                }

                                if progress_info.percentage != last_percentage
                                    || progress_info.status == "安装失败"
                                {
                                    info!(
                                        "[PTY] Progress changed or error detected: {}% -> {}%, status: {}",
                                        last_percentage, progress_info.percentage, progress_info.status
                                    );
                                    if progress_info.percentage != last_percentage {
                                        last_percentage = progress_info.percentage;
                                    }

                                    if let Err(e) =
                                        app_handle.emit("install-progress", &progress_info)
                                    {
                                        warn!("[PTY Reader] WARN: Failed to emit progress: {}", e);
                                    }
                                }
                            }
                        }

                        if line_buffer.contains('%') && line_buffer.contains('\r') {
                            record_cli_output(&line_buffer);
                            let progress_info = parse_install_progress(&line_buffer, &app_id);

                            if let Ok(mut auth_guard) = auth_wait_start_reader.lock() {
                                if progress_info.status == "等待授权" {
                                    if auth_guard.is_none() {
                                        info!("[PTY] Detected auth request (partial), starting timer");
                                        *auth_guard = Some(Instant::now());
                                    }
                                } else if !progress_info.status.is_empty()
                                    && progress_info.status != "正在处理"
                                {
                                    if auth_guard.is_some() {
                                        info!(
                                            "[PTY] Auth state cleared (partial), status: {}",
                                            progress_info.status
                                        );
                                        *auth_guard = None;
                                    }
                                }
                            }

                            if progress_info.percentage != last_percentage
                                || progress_info.status == "安装失败"
                            {
                                info!(
                                    "[PTY] Progress changed (partial): {}% -> {}%",
                                    last_percentage, progress_info.percentage
                                );
                                if progress_info.percentage != last_percentage {
                                    last_percentage = progress_info.percentage;
                                }

                                let _ = app_handle.emit("install-progress", &progress_info);
                            }
                        }
                    }
                    Err(e) => {
                        error!("[PTY Reader] Error reading: {}", e);
                        break;
                    }
                }
            }

            if !line_buffer.trim().is_empty() {
                record_cli_output(&line_buffer);
                if line_buffer.contains('%') {
                    info!("[PTY Final] Processing remaining buffer");
                    let progress_info = parse_install_progress(&line_buffer, &app_id);
                    let _ = app_handle.emit("install-progress", &progress_info);
                }
            }

            info!("[PTY Reader] Finished reading output");
        })
    }

    /// Poll child process for completion while honoring the 60s auth timeout.
    fn wait_for_completion(
        &self,
        child_arc: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
    ) -> Result<ExitStatus, String> {
        info!("[install_linglong_app] Waiting for process to complete...");

        loop {
            let status = {
                let mut child = child_arc
                    .lock()
                    .map_err(|e| format!("Failed to lock child process: {}", e))?;

                match child.try_wait() {
                    Ok(Some(status)) => {
                        info!("[install_linglong_app] Process exited");
                        Some(status)
                    }
                    Ok(None) => None,
                    Err(e) => {
                        let err_msg = format!("Failed to check process status: {}", e);
                        error!("[install_linglong_app] ERROR: {}", err_msg);
                        return Err(err_msg);
                    }
                }
            };

            if let Ok(auth_guard) = self.auth_wait_start.lock() {
                if let Some(start_time) = *auth_guard {
                    if start_time.elapsed().as_secs() > 60 {
                        warn!(
                            "[install_linglong_app] Authorization timed out (>60s). Killing process..."
                        );

                        if let Ok(mut child) = child_arc.lock() {
                            let _ = child.kill();
                        }

                        let _ = self.app_handle.emit(
                            "install-progress",
                            &InstallProgress {
                                app_id: self.app_id.clone(),
                                progress: "error".to_string(),
                                percentage: 0,
                                status: "安装失败: 授权超时".to_string(),
                            },
                        );

                        return Err("Authorization timed out".to_string());
                    }
                }
            }

            if let Some(status) = status {
                return Ok(status);
            }

            thread::sleep(std::time::Duration::from_millis(100));
        }
    }

    /// Decide final outcome, emit terminal events, and return result to caller.
    fn handle_exit(&self, exit_status: ExitStatus) -> Result<String, String> {
        info!(
            "[install_linglong_app] Process exited with status: {:?}",
            exit_status
        );

        if !exit_status.success() {
            let mut failure_message = format!("ll-cli install command failed: {:?}", exit_status);

            if self.force_hint_detected.load(Ordering::Relaxed) {
                failure_message = self.get_force_hint_message();
            } else if let Ok(last_line_guard) = self.last_cli_message.lock() {
                if let Some(last_line) = &*last_line_guard {
                    failure_message = last_line.clone();
                }
            }

            error!("[install_linglong_app] ERROR: {}", failure_message);

            let status_msg = if failure_message.contains("Request dismissed")
                || failure_message.contains("Authentication is required")
                || failure_message.contains("AUTHENTICATING FOR")
            {
                "安装失败: 授权失败".to_string()
            } else {
                "安装失败".to_string()
            };

            let _ = self.app_handle.emit(
                "install-progress",
                &InstallProgress {
                    app_id: self.app_id.clone(),
                    progress: "error".to_string(),
                    percentage: 0,
                    status: status_msg.clone(),
                },
            );

            if status_msg.contains("授权失败") {
                return Err(status_msg);
            }

            return Err(failure_message);
        }

        if !self.force && self.force_hint_detected.load(Ordering::Relaxed) {
            let failure_message = self.get_force_hint_message();
            warn!(
                "[install_linglong_app] FORCE HINT DETECTED WITHOUT FORCE FLAG: {}",
                failure_message
            );
            let _ = self.app_handle.emit(
                "install-progress",
                &InstallProgress {
                    app_id: self.app_id.clone(),
                    progress: "error".to_string(),
                    percentage: 0,
                    status: "安装失败".to_string(),
                },
            );
            return Err(failure_message);
        }

        let success_msg = if let Some(ver) = &self.version {
            format!("Successfully installed {} version {}", self.app_id, ver)
        } else {
            format!("Successfully installed {}", self.app_id)
        };

        info!("[install_linglong_app] SUCCESS: {}", success_msg);

        let _ = self.app_handle.emit(
            "install-progress",
            &InstallProgress {
                app_id: self.app_id.clone(),
                progress: "100%".to_string(),
                percentage: 100,
                status: "安装完成".to_string(),
            },
        );

        Ok(success_msg)
    }

    fn get_force_hint_message(&self) -> String {
        let fallback = format!("ll-cli install {}/version --force", self.app_id);
        match self.force_hint_message.lock() {
            Ok(msg_guard) => msg_guard.clone().unwrap_or(fallback),
            Err(_) => fallback,
        }
    }
}

/// Parse ll-cli progress output into structured info (percentage + status text).
/// Handles carriage returns so in-line progress bars still emit final state.
fn parse_install_progress(line: &str, app_id: &str) -> InstallProgress {
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("[parse_install_progress] Original line length: {} bytes", line.len());

    let cleaned = line
        .replace("\x1b[K", "")
        .replace("\x1b[?25l", "")
        .replace("\x1b[?25h", "")
        .replace("[K", "")
        .replace("[?25l", "")
        .replace("[?25h", "");

    let parts: Vec<&str> = cleaned.split('\r').collect();
    let latest_progress = parts
        .iter()
        .rev()
        .find(|s| !s.trim().is_empty())
        .map(|s| s.trim())
        .unwrap_or("");

    info!("[parse_install_progress] Total progress updates in line: {}", parts.len());
    info!("[parse_install_progress] ll-cli output: {:?}", latest_progress);

    let percentage = if let Some(percent_pos) = latest_progress.rfind('%') {
        let before_percent = &latest_progress[..percent_pos];
        let digits: String = before_percent
            .chars()
            .rev()
            .take_while(|c| c.is_ascii_digit() || *c == '.')
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();

        let percent_value = digits.parse::<f64>().map(|f| f as u32).unwrap_or(0);
        info!("[parse_install_progress] ✓ Parsed percentage: {}%", percent_value);
        percent_value
    } else {
        warn!("[parse_install_progress] ✗ No '%' found in latest progress");
        0
    };

    let status = if latest_progress.contains("Beginning to install") {
        "开始安装".to_string()
    } else if latest_progress.contains("Installing application") {
        "正在安装应用".to_string()
    } else if latest_progress.contains("Installing runtime") {
        "正在安装运行时".to_string()
    } else if latest_progress.contains("Installing base") {
        "正在安装基础包".to_string()
    } else if latest_progress.contains("Downloading metadata") {
        "正在下载元数据".to_string()
    } else if latest_progress.contains("Downloading files") {
        "正在下载文件".to_string()
    } else if latest_progress.contains("processing after install") {
        "安装后处理".to_string()
    } else if latest_progress.contains("success") {
        "安装完成".to_string()
    } else if latest_progress.contains("download") || latest_progress.contains("下载") {
        "正在下载".to_string()
    } else if latest_progress.contains("install") || latest_progress.contains("安装") {
        "正在安装".to_string()
    } else if latest_progress.contains("Authentication is required")
        || latest_progress.contains("AUTHENTICATING FOR")
        || latest_progress.contains("Authenticating as")
    {
        "等待授权".to_string()
    } else if latest_progress
        .contains("Error executing command as another user: Request dismissed")
    {
        "安装失败".to_string()
    } else if latest_progress.to_lowercase().contains("error")
        || latest_progress.contains("错误")
        || latest_progress.to_lowercase().contains("failed")
    {
        "安装失败".to_string()
    } else if latest_progress.to_lowercase().contains("package not found")
        || latest_progress.contains("no modules found")
    {
        "安装失败: 找不到App，请重试".to_string()
    } else if !latest_progress.is_empty() {
        let status_text = if latest_progress.len() > 50 {
            format!("{}...", &latest_progress[..50])
        } else {
            latest_progress.to_string()
        };
        status_text
    } else {
        "正在处理".to_string()
    };

    let result = InstallProgress {
        app_id: app_id.to_string(),
        progress: latest_progress.to_string(),
        percentage,
        status: status.clone(),
    };

    info!("[parse_install_progress] ═══ RESULT ═══");
    info!("[parse_install_progress] percentage: {}%", result.percentage);
    info!("[parse_install_progress] status: {}", result.status);
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    result
}
