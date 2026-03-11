//! 玲珑环境安装
//!
//! 本模块封装通过 pkexec 执行安装脚本的特权操作。
//! 在 `spawn_blocking` 中运行以避免阻塞 async 运行时。

use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// 安装玲珑环境的执行结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstallLinglongResult {
    pub stdout: String,
    pub stderr: String,
}

/// 通过 pkexec 执行安装脚本安装玲珑环境
///
/// 将脚本写入临时文件后以特权执行，完成后清理脚本文件。
pub async fn install_linglong_env(script_content: String) -> Result<InstallLinglongResult, String> {
    if script_content.trim().is_empty() {
        return Err("安装脚本内容为空".to_string());
    }
    let script = script_content.clone();
    let handle = tokio::task::spawn_blocking(move || -> Result<InstallLinglongResult, String> {
        let file_name = format!(
            "install-linglong-{}.sh",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|e| format!("获取时间失败: {}", e))?
                .as_millis()
        );
        let mut path = PathBuf::from(std::env::temp_dir());
        path.push(file_name);

        {
            let mut file = fs::File::create(&path)
                .map_err(|e| format!("创建安装脚本失败: {}", e))?;
            file.write_all(script.as_bytes())
                .map_err(|e| format!("写入安装脚本失败: {}", e))?;
        }
        fs::set_permissions(&path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("设置脚本权限失败: {}", e))?;

        info!("[install_linglong_env] executing script at {:?}", path);
        let output = Command::new("pkexec")
            .arg("bash")
            .arg(&path)
            .output()
            .map_err(|e| format!("执行安装脚本失败: {}", e))?;

        if !output.status.success() {
            warn!(
                "[install_linglong_env] script failed with code {:?}",
                output.status.code()
            );
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(format!(
                "安装失败(code {:?}): {}",
                output.status.code(),
                stderr
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        // 清理脚本文件
        let _ = fs::remove_file(&path);
        Ok(InstallLinglongResult { stdout, stderr })
    });

    handle
        .await
        .map_err(|e| format!("安装任务执行失败: {}", e))?
}
