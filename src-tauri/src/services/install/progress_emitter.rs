//! 进度事件发送器
//!
//! 本模块封装了 Tauri 事件发送逻辑，提供统一的进度事件发送接口。

use log::{error, info};
use tauri::{AppHandle, Emitter};

use super::error_codes::{get_error_status_from_code, get_status_from_message};
use super::models::InstallProgress;

/// 安装进度事件名称
const INSTALL_PROGRESS_EVENT: &str = "install-progress";

/// 进度事件发送器
///
/// 封装 Tauri 事件发送逻辑，提供类型安全的进度事件发送接口。
pub struct ProgressEmitter<'a> {
    app_handle: &'a AppHandle,
    app_id: String,
}

impl<'a> ProgressEmitter<'a> {
    /// 创建新的进度发送器
    pub fn new(app_handle: &'a AppHandle, app_id: String) -> Self {
        Self { app_handle, app_id }
    }

    /// 发送初始等待事件
    pub fn emit_waiting(&self) {
        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "message".to_string(),
            message: "Starting installation...".to_string(),
            percentage: 0,
            status: "等待安装".to_string(),
            code: None,
            error_detail: None,
        });
    }

    /// 发送进度更新事件
    #[allow(dead_code)]
    pub fn emit_progress(&self, percentage: u32, message: &str) {
        let status = get_status_from_message(message);

        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "progress".to_string(),
            message: message.to_string(),
            percentage,
            status,
            code: None,
            error_detail: None,
        });

        info!("[ProgressEmitter] Progress: {}%", percentage);
    }

    /// 发送消息事件（不改变进度）
    #[allow(dead_code)]
    pub fn emit_message(&self, message: &str, current_percentage: u32) {
        let status = get_status_from_message(message);

        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "message".to_string(),
            message: message.to_string(),
            percentage: current_percentage,
            status,
            code: None,
            error_detail: None,
        });

        info!("[ProgressEmitter] Message: {}", message);
    }

    /// 发送错误事件
    pub fn emit_error(&self, code: i32, message: &str) {
        let status = get_error_status_from_code(code);

        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "error".to_string(),
            message: message.to_string(),
            percentage: 0,
            status,
            code: Some(code),
            error_detail: Some(message.to_string()),
        });

        error!("[ProgressEmitter] Error: code={}, message={}", code, message);
    }

    /// 发送安装成功事件
    pub fn emit_success(&self) {
        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "progress".to_string(),
            message: "Installation completed successfully".to_string(),
            percentage: 100,
            status: "安装完成".to_string(),
            code: None,
            error_detail: None,
        });

        info!("[ProgressEmitter] Success");
    }

    /// 发送安装取消事件
    pub fn emit_cancelled(&self) {
        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "cancelled".to_string(),
            message: "Installation cancelled by user".to_string(),
            percentage: 0,
            status: "安装已取消".to_string(),
            code: Some(1), // 1 = Cancelled
            error_detail: Some("用户取消了安装操作".to_string()),
        });

        info!("[ProgressEmitter] Cancelled");
    }

    /// 发送超时错误事件
    pub fn emit_timeout(&self) {
        self.emit(InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "error".to_string(),
            message: "Installation timed out: no progress for too long".to_string(),
            percentage: 0,
            status: "安装失败: 进度超时".to_string(),
            code: Some(-2),
            error_detail: Some("长时间未收到进度更新，安装已超时".to_string()),
        });

        error!("[ProgressEmitter] Timeout");
    }

    /// 内部发送方法
    fn emit(&self, progress: InstallProgress) {
        let _ = self.app_handle.emit(INSTALL_PROGRESS_EVENT, &progress);
    }
}

/// 线程安全的进度发送器（用于子线程）
///
/// 由于 AppHandle 是 Clone 的，可以在线程间安全传递。
pub struct ThreadSafeProgressEmitter {
    app_handle: AppHandle,
    app_id: String,
}

impl ThreadSafeProgressEmitter {
    /// 创建新的线程安全进度发送器
    pub fn new(app_handle: AppHandle, app_id: String) -> Self {
        Self { app_handle, app_id }
    }

    /// 发送进度更新事件
    pub fn emit_progress(&self, percentage: u32, message: &str) {
        let status = get_status_from_message(message);

        let progress = InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "progress".to_string(),
            message: message.to_string(),
            percentage,
            status,
            code: None,
            error_detail: None,
        };

        let _ = self.app_handle.emit(INSTALL_PROGRESS_EVENT, &progress);
        info!("[ThreadEmitter] Progress: {}%", percentage);
    }

    /// 发送消息事件
    pub fn emit_message(&self, message: &str, current_percentage: u32) {
        let status = get_status_from_message(message);

        let progress = InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "message".to_string(),
            message: message.to_string(),
            percentage: current_percentage,
            status,
            code: None,
            error_detail: None,
        };

        let _ = self.app_handle.emit(INSTALL_PROGRESS_EVENT, &progress);
        info!("[ThreadEmitter] Message: {}", message);
    }

    /// 发送错误事件
    pub fn emit_error(&self, code: i32, message: &str) {
        let status = get_error_status_from_code(code);

        let progress = InstallProgress {
            app_id: self.app_id.clone(),
            event_type: "error".to_string(),
            message: message.to_string(),
            percentage: 0,
            status,
            code: Some(code),
            error_detail: Some(message.to_string()),
        };

        let _ = self.app_handle.emit(INSTALL_PROGRESS_EVENT, &progress);
        error!("[ThreadEmitter] Error: code={}, message={}", code, message);
    }
}
