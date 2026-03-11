use log::{info, error};
use crate::services::executor;

/// 清理废弃的基础服务
/// 调用 ll-cli prune 命令
pub async fn prune_linglong_apps() -> Result<String, String> {
    info!("[prune_linglong_apps] Starting prune operation");

    let output = executor::execute(&["prune"], "prune").await?;

    if output.success {
        let message = if output.stdout.trim().is_empty() {
            "清理完成".to_string()
        } else {
            output.stdout.trim().to_string()
        };
        info!("[prune_linglong_apps] Prune completed successfully: {}", message);
        Ok(message)
    } else {
        let error_msg = if !output.stderr.trim().is_empty() {
            output.stderr.trim().to_string()
        } else {
            "清理失败".to_string()
        };
        error!("[prune_linglong_apps] Prune failed: {}", error_msg);
        Err(error_msg)
    }
}
