use serde::{Deserialize, Serialize};
use std::process::Command;
use std::io::Read;
use tauri::{AppHandle, Emitter};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};

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

/// 卸载指定的玲珑应用
pub async fn uninstall_linglong_app(app_id: String, version: String) -> Result<String, String> {
    let app_ref = format!("{}/{}", app_id, version);
    
    let output = Command::new("ll-cli")
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
    println!("[search_app_versions] Searching for installed versions of app_id: {}", app_id);
    
    // 使用 ll-cli list 获取所有已安装的应用，而不是
    let output = Command::new("ll-cli")
        .arg("list")
        .arg("--json")
        .arg("--type=all")
        .output()
        .map_err(|e| {
            let err_msg = format!("Failed to execute 'll-cli list': {}", e);
            println!("[search_app_versions] Error: {}", err_msg);
            err_msg
        })?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        let err = format!("ll-cli list command failed: {}", error_msg);
        println!("[search_app_versions] {}", err);
        return Err(err);
    }

    let output_string = String::from_utf8_lossy(&output.stdout);
    let trimmed = output_string.trim();
    
    println!("[search_app_versions] Output length: {} bytes", trimmed.len());
    
    if trimmed.is_empty() {
        println!("[search_app_versions] Empty output, returning empty vec");
        return Ok(Vec::new());
    }

    // 解析 JSON 输出
    let list_items: Vec<LLCliListItem> = serde_json::from_str(trimmed)
        .map_err(|e| {
            let err_msg = format!("Failed to parse ll-cli list output: {}", e);
            println!("[search_app_versions] Parse error: {}", err_msg);
            err_msg
        })?;
    
    println!("[search_app_versions] Found {} installed items", list_items.len());
    
    // 过滤出指定 app_id 的所有版本
    let apps: Vec<InstalledApp> = list_items
        .into_iter()
        .filter(|item| {
            // 匹配 app_id 或 name
            let matches = item.app_id.as_ref().map_or(false, |id| id == &app_id) 
                || item.name == app_id;
            if matches {
                println!("[search_app_versions] Found matching app: {} ({})", 
                         item.name, 
                         item.app_id.as_ref().unwrap_or(&item.name));
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

    println!("[search_app_versions] Found {} installed versions for app_id: {}", apps.len(), app_id);
    for app in &apps {
        println!("[search_app_versions] - {} version: {}, channel: {}, module: {}", 
                 app.app_id, app.version, app.channel, app.module);
    }

    Ok(apps)
}

/// 运行指定的玲珑应用
pub async fn run_linglong_app(app_id: String, version: String) -> Result<String, String> {
    let app_ref = format!("{}/{}", app_id, version);
    
    let output = Command::new("ll-cli")
        .arg("run")
        .arg(&app_ref)
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli run': {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ll-cli run command failed: {}", error_msg));
    }

    Ok(format!("Successfully launched {} version {}", app_id, version))
}

/// 安装进度事件数据结构
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub app_id: String,
    pub progress: String,      // 原始进度文本
    pub percentage: u32,        // 百分比数值 (0-100)
    pub status: String,         // 状态描述
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
    println!("========== [install_linglong_app] START ==========");
    println!("[install_linglong_app] app_id: {}", app_id);
    println!("[install_linglong_app] version: {:?}", version);
    println!("[install_linglong_app] force: {}", force);
    
    // 构建应用引用
    let app_ref = if let Some(ver) = version.as_ref() {
        format!("{}/{}", app_id, ver)
    } else {
        app_id.clone()
    };
    
    // 使用 PTY (伪终端) 来运行命令
    // 这样 ll-cli 会认为它在真实的终端中运行，会输出进度信息
    // 同时我们也能捕获这些输出
    let pty_system = native_pty_system();
    
    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| {
            let err_msg = format!("Failed to create PTY: {}", e);
            println!("[install_linglong_app] ERROR: {}", err_msg);
            err_msg
        })?;
    
    // 构建命令
    let mut cmd = CommandBuilder::new("ll-cli");
    cmd.arg("install");
    cmd.arg(&app_ref);
    cmd.arg("-y"); // 自动回答是
    
    if force {
        cmd.arg("--force");
    }
    
    let command_str = format!(
        "ll-cli install {} -y{}", 
        app_ref, 
        if force { " --force" } else { "" }
    );
    println!("[install_linglong_app] Executing command: {}", command_str);
    
    // 在 PTY 中启动命令
    let mut child = pty_pair.slave.spawn_command(cmd).map_err(|e| {
        let err_msg = format!("Failed to spawn command in PTY: {}", e);
        println!("[install_linglong_app] ERROR: {}", err_msg);
        err_msg
    })?;
    
    println!("[install_linglong_app] Process spawned in PTY successfully");
    
    // 从 PTY master 读取输出
    let mut reader = pty_pair
        .master
        .try_clone_reader()
        .map_err(|e| {
            let err_msg = format!("Failed to clone PTY reader: {}", e);
            println!("[install_linglong_app] ERROR: {}", err_msg);
            err_msg
        })?;
    
    println!("[install_linglong_app] Starting to read PTY output...");
    println!("==========================================================");
    
    // 在单独的线程中读取 PTY 输出
    let app_id_clone = app_id.clone();
    let app_handle_clone = app_handle.clone();
    
    let reader_handle = std::thread::spawn(move || {
        let mut buffer = [0u8; 8192];  // 增大缓冲区
        let mut line_buffer = String::new();
        let mut last_percentage = 0u32;  // 追踪上次发送的百分比
        
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    println!("[PTY Reader] EOF reached");
                    break;
                }
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buffer[..n]);
                    
                    // 将读取的内容添加到行缓冲区
                    line_buffer.push_str(&text);
                    
                    // 处理换行符分隔的完整行
                    while let Some(newline_pos) = line_buffer.find('\n') {
                        let line = line_buffer[..newline_pos].to_string();
                        line_buffer = line_buffer[newline_pos + 1..].to_string();
                        
                        if !line.trim().is_empty() {
                            let progress_info = parse_install_progress(&line, &app_id_clone);
                            
                            // 只有当百分比变化时才发送事件，避免大量重复更新
                            if progress_info.percentage != last_percentage {
                                println!("[PTY] Progress changed: {}% -> {}%", last_percentage, progress_info.percentage);
                                last_percentage = progress_info.percentage;
                                
                                if let Err(e) = app_handle_clone.emit("install-progress", &progress_info) {
                                    println!("[PTY Reader] WARN: Failed to emit progress: {}", e);
                                }
                            }
                        }
                    }
                    
                    // 处理缓冲区中包含百分比但没有换行符的内容（同行更新的进度条）
                    if line_buffer.contains('%') && line_buffer.contains('\r') {
                        let progress_info = parse_install_progress(&line_buffer, &app_id_clone);
                        
                        if progress_info.percentage != last_percentage {
                            println!("[PTY] Progress changed (partial): {}% -> {}%", last_percentage, progress_info.percentage);
                            last_percentage = progress_info.percentage;
                            
                            let _ = app_handle_clone.emit("install-progress", &progress_info);
                        }
                    }
                }
                Err(e) => {
                    println!("[PTY Reader] Error reading: {}", e);
                    break;
                }
            }
        }
        
        // 处理剩余的缓冲区内容
        if !line_buffer.trim().is_empty() && line_buffer.contains('%') {
            println!("[PTY Final] Processing remaining buffer");
            let progress_info = parse_install_progress(&line_buffer, &app_id_clone);
            let _ = app_handle_clone.emit("install-progress", &progress_info);
        }
        
        println!("[PTY Reader] Finished reading output");
    });
    
    println!("[install_linglong_app] Waiting for process to complete...");
    
    // 等待进程结束
    let exit_status = child.wait().map_err(|e| {
        let err_msg = format!("Failed to wait for 'll-cli install': {}", e);
        println!("[install_linglong_app] ERROR: {}", err_msg);
        err_msg
    })?;
    
    // 等待读取线程完成
    let _ = reader_handle.join();
    
    println!("==========================================================");
    println!("[install_linglong_app] Process exited with status: {:?}", exit_status);

    if !exit_status.success() {
        let err = format!("ll-cli install command failed: {:?}", exit_status);
        println!("[install_linglong_app] ERROR: {}", err);
        
        // 发送失败事件
        let _ = app_handle.emit("install-progress", &InstallProgress {
            app_id: app_id.clone(),
            progress: "error".to_string(),
            percentage: 0,
            status: "安装失败".to_string(),
        });
        
        return Err(err);
    }

    let success_msg = if let Some(ver) = version {
        format!("Successfully installed {} version {}", app_id, ver)
    } else {
        format!("Successfully installed {}", app_id)
    };
    
    println!("[install_linglong_app] SUCCESS: {}", success_msg);
    
    // 发送完成事件
    let _ = app_handle.emit("install-progress", &InstallProgress {
        app_id: app_id.clone(),
        progress: "100%".to_string(),
        percentage: 100,
        status: "安装完成".to_string(),
    });
    
    println!("========== [install_linglong_app] END ==========");
    Ok(success_msg)
}

/// 解析安装进度字符串
/// 处理 PTY 输出中的 \r 字符（用于在同一行更新进度条）
/// 示例输入包含多个 \r 分隔的进度更新
fn parse_install_progress(line: &str, app_id: &str) -> InstallProgress {
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("[parse_install_progress] Original line length: {} bytes", line.len());
    
    // 移除 ANSI 控制字符
    let cleaned = line
        .replace("\x1b[K", "")
        .replace("\x1b[?25l", "")
        .replace("\x1b[?25h", "")
        .replace("[K", "")
        .replace("[?25l", "")
        .replace("[?25h", "");
    
    // 按 \r 分割，获取最后一个非空的进度更新
    let parts: Vec<&str> = cleaned.split('\r').collect();
    let latest_progress = parts
        .iter()
        .rev()
        .find(|s| !s.trim().is_empty())
        .map(|s| s.trim())
        .unwrap_or("");
    
    println!("[parse_install_progress] Total progress updates in line: {}", parts.len());
    println!("[parse_install_progress] Latest progress: {:?}", latest_progress);
    
    // 从最新的进度文本中提取百分比
    let percentage = if let Some(percent_pos) = latest_progress.rfind('%') {
        // 向前查找数字
        let before_percent = &latest_progress[..percent_pos];
        let digits: String = before_percent
            .chars()
            .rev()
            .take_while(|c| c.is_ascii_digit())
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();
        
        let percent_value = digits.parse::<u32>().unwrap_or(0);
        println!("[parse_install_progress] ✓ Parsed percentage: {}%", percent_value);
        percent_value
    } else {
        println!("[parse_install_progress] ✗ No '%' found in latest progress");
        0
    };
    
    // 从最新的进度文本中提取状态描述
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
    } else if latest_progress.contains("error") || latest_progress.contains("错误") || latest_progress.contains("failed") {
        "安装失败".to_string()
    } else if !latest_progress.is_empty() {
        // 截取前50个字符作为状态
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
    
    println!("[parse_install_progress] ═══ RESULT ═══");
    println!("[parse_install_progress] percentage: {}%", result.percentage);
    println!("[parse_install_progress] status: {}", result.status);
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    result
}
