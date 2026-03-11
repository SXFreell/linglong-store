//! 安装槽位管理
//!
//! 本模块管理单槽位安装状态，确保同时只有一个安装任务进行。
//! 
//! 关键特性：
//! - 单槽位模式：同时只允许一个安装任务
//! - 取消标志：区分"用户取消"和"真正失败"
//! - 线程安全：使用 Mutex 保护共享状态

use log::info;
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex, MutexGuard};

/// 安装槽位状态
#[derive(Debug, Clone)]
pub struct InstallSlotState {
    /// 当前正在安装的应用 ID
    pub app_id: String,
    /// 是否被用户取消
    pub is_cancelled: bool,
}

/// 全局安装槽位（单槽位模式）
/// 使用 std::sync::Mutex 而非 tokio::sync::Mutex：所有方法均为同步调用，
/// 锁范围极小且不跨越 .await 点，std::sync::Mutex 性能更优
static INSTALL_SLOT: Lazy<Arc<Mutex<Option<InstallSlotState>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

/// 安装槽位管理器
///
/// 提供静态方法管理全局安装槽位状态。
pub struct InstallSlot;

impl InstallSlot {
    /// 尝试占用槽位
    ///
    /// # Arguments
    /// * `app_id` - 要安装的应用 ID
    ///
    /// # Returns
    /// * `Ok(())` - 成功占用槽位
    /// * `Err(String)` - 槽位已被占用，返回正在安装的应用 ID
    pub fn acquire(app_id: &str) -> Result<(), String> {
        let mut slot = Self::lock()?;

        if let Some(ref state) = *slot {
            return Err(format!(
                "已有应用正在安装中: {}，请等待完成后再试",
                state.app_id
            ));
        }

        *slot = Some(InstallSlotState {
            app_id: app_id.to_string(),
            is_cancelled: false,
        });

        info!("[InstallSlot] Acquired slot for: {}", app_id);
        Ok(())
    }

    /// 释放槽位
    ///
    /// 无论安装成功、失败还是取消，都应调用此方法释放槽位。
    pub fn release() {
        if let Ok(mut slot) = Self::lock() {
            if let Some(ref state) = *slot {
                info!("[InstallSlot] Released slot for: {}", state.app_id);
            }
            *slot = None;
        }
    }

    /// 标记当前安装为已取消
    ///
    /// # Returns
    /// * `true` - 成功标记（有正在进行的安装）
    /// * `false` - 无法标记（没有正在进行的安装）
    pub fn mark_cancelled() -> bool {
        if let Ok(mut slot) = Self::lock() {
            if let Some(ref mut state) = *slot {
                state.is_cancelled = true;
                info!("[InstallSlot] Marked as cancelled: {}", state.app_id);
                return true;
            }
        }
        false
    }

    /// 检查当前安装是否已被取消
    ///
    /// # Returns
    /// * `true` - 已被用户取消
    /// * `false` - 未被取消或无安装任务
    pub fn is_cancelled() -> bool {
        if let Ok(slot) = Self::lock() {
            if let Some(ref state) = *slot {
                return state.is_cancelled;
            }
        }
        false
    }

    /// 获取当前正在安装的应用 ID
    ///
    /// # Returns
    /// * `Some(String)` - 正在安装的应用 ID
    /// * `None` - 没有正在进行的安装
    #[allow(dead_code)]
    pub fn current_app_id() -> Option<String> {
        if let Ok(slot) = Self::lock() {
            return slot.as_ref().map(|s| s.app_id.clone());
        }
        None
    }

    /// 检查槽位是否空闲
    #[allow(dead_code)]
    pub fn is_idle() -> bool {
        if let Ok(slot) = Self::lock() {
            return slot.is_none();
        }
        false
    }

    /// 获取锁
    fn lock() -> Result<MutexGuard<'static, Option<InstallSlotState>>, String> {
        INSTALL_SLOT
            .lock()
            .map_err(|e| format!("Failed to lock install slot: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 注意：这些测试需要串行执行，因为它们共享全局状态
    // 使用 cargo test -- --test-threads=1

    #[test]
    fn test_slot_lifecycle() {
        // 确保槽位初始为空
        InstallSlot::release();
        assert!(InstallSlot::is_idle());

        // 占用槽位
        assert!(InstallSlot::acquire("test.app").is_ok());
        assert!(!InstallSlot::is_idle());
        assert_eq!(InstallSlot::current_app_id(), Some("test.app".to_string()));

        // 再次占用应失败
        assert!(InstallSlot::acquire("another.app").is_err());

        // 释放槽位
        InstallSlot::release();
        assert!(InstallSlot::is_idle());
    }

    #[test]
    fn test_cancellation_flag() {
        InstallSlot::release();
        
        // 无安装时标记取消应返回 false
        assert!(!InstallSlot::mark_cancelled());

        // 有安装时可以标记
        InstallSlot::acquire("test.app").unwrap();
        assert!(!InstallSlot::is_cancelled());
        
        assert!(InstallSlot::mark_cancelled());
        assert!(InstallSlot::is_cancelled());

        // 释放后取消状态也清除
        InstallSlot::release();
        assert!(!InstallSlot::is_cancelled());
    }
}
