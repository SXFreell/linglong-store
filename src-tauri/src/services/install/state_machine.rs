//! 安装状态机
//!
//! 本模块实现了安装过程的状态机，负责管理安装过程中的状态转换。
//! 
//! 状态转换图：
//! ```text
//! IDLE
//!   ├─ start() ────────────────────▶ WAITING
//!
//! WAITING
//!   ├─ on_progress() ──────────────▶ INSTALLING
//!   ├─ on_error() ─────────────────▶ FAILED
//!   ├─ check_timeout() ────────────▶ FAILED
//!   └─ on_failure() ───────────────▶ FAILED
//!
//! INSTALLING
//!   ├─ on_progress() ──────────────▶ INSTALLING (保持)
//!   ├─ on_error() ─────────────────▶ FAILED
//!   ├─ check_timeout() ────────────▶ FAILED
//!   ├─ on_success() ───────────────▶ SUCCEEDED
//!   └─ on_failure() ───────────────▶ FAILED
//! ```

use log::info;
use std::time::Instant;

/// 进度超时时间（秒）- 无进度更新则判定失败
pub const PROGRESS_TIMEOUT_SECS: u64 = 360;

/// 安装状态枚举
#[derive(Debug, Clone, PartialEq)]
pub enum InstallState {
    /// 空闲状态
    Idle,
    /// 等待安装（已启动进程但未收到进度百分比）
    Waiting,
    /// 安装中（已收到进度百分比）
    Installing,
    /// 安装成功
    Succeeded,
    /// 安装失败
    Failed,
}

/// 安装状态机
///
/// 负责管理安装过程中的状态转换，独立于具体的安装实现。
pub struct InstallStateMachine {
    /// 当前状态
    state: InstallState,
    /// 上次进度更新时间
    last_progress_at: Instant,
    /// 上次进度百分比
    last_percentage: f32,
}

impl InstallStateMachine {
    /// 创建新的状态机实例
    pub fn new() -> Self {
        Self {
            state: InstallState::Idle,
            last_progress_at: Instant::now(),
            last_percentage: 0.0,
        }
    }

    /// 获取当前状态
    #[allow(dead_code)]
    pub fn state(&self) -> &InstallState {
        &self.state
    }

    /// 获取上次进度百分比
    #[allow(dead_code)]
    pub fn last_percentage(&self) -> f32 {
        self.last_percentage
    }

    /// 开始安装，进入 WAITING 状态
    pub fn start(&mut self) {
        self.state = InstallState::Waiting;
        self.last_progress_at = Instant::now();
        self.last_percentage = 0.0;
        info!("[StateMachine] State: Idle -> Waiting");
    }

    /// 收到进度事件，进入/保持 INSTALLING 状态
    pub fn on_progress(&mut self, percentage: f32) {
        if self.state == InstallState::Waiting {
            info!("[StateMachine] State: Waiting -> Installing");
        }
        self.state = InstallState::Installing;
        self.last_progress_at = Instant::now();
        self.last_percentage = percentage;
    }

    /// 收到错误事件，进入 FAILED 状态
    pub fn on_error(&mut self) {
        info!(
            "[StateMachine] State: {:?} -> Failed (ErrorEvent)",
            self.state
        );
        self.state = InstallState::Failed;
    }

    /// 进程正常退出（exit code 0），进入 SUCCEEDED 状态
    pub fn on_success(&mut self) {
        info!("[StateMachine] State: {:?} -> Succeeded", self.state);
        self.state = InstallState::Succeeded;
    }

    /// 进程异常退出或超时，进入 FAILED 状态
    pub fn on_failure(&mut self) {
        info!("[StateMachine] State: {:?} -> Failed", self.state);
        self.state = InstallState::Failed;
    }

    /// 检查是否超时（无进度更新超过阈值）
    pub fn check_timeout(&self) -> bool {
        if self.state == InstallState::Waiting || self.state == InstallState::Installing {
            return self.last_progress_at.elapsed().as_secs() > PROGRESS_TIMEOUT_SECS;
        }
        false
    }

    /// 刷新进度时间戳（用于收到消息事件时）
    pub fn touch(&mut self) {
        self.last_progress_at = Instant::now();
    }
}

impl Default for InstallStateMachine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_transitions() {
        let mut sm = InstallStateMachine::new();
        assert_eq!(*sm.state(), InstallState::Idle);

        sm.start();
        assert_eq!(*sm.state(), InstallState::Waiting);

        sm.on_progress(50.0);
        assert_eq!(*sm.state(), InstallState::Installing);
        assert!((sm.last_percentage() - 50.0).abs() < 0.1);

        sm.on_success();
        assert_eq!(*sm.state(), InstallState::Succeeded);
    }

    #[test]
    fn test_error_transition() {
        let mut sm = InstallStateMachine::new();
        sm.start();
        sm.on_error();
        assert_eq!(*sm.state(), InstallState::Failed);
    }

    #[test]
    fn test_timeout_check() {
        let mut sm = InstallStateMachine::new();
        sm.start();
        
        // 刚启动不应该超时
        assert!(!sm.check_timeout());
        
        // 空闲状态不检查超时
        let sm_idle = InstallStateMachine::new();
        assert!(!sm_idle.check_timeout());
    }
}
