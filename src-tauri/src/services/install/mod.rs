//! 玲珑应用安装模块
//!
//! 本模块负责管理玲珑应用的安装、卸载、运行等生命周期操作。
//! 采用分层架构设计，各子模块职责清晰：
//!
//! - `models`: 数据模型定义
//! - `error_codes`: 错误码映射
//! - `json_parser`: ll-cli JSON 输出解析
//! - `state_machine`: 安装状态机
//! - `slot`: 安装槽位管理（含取消标志）
//! - `progress_emitter`: 进度事件发送器
//! - `installer`: 安装器核心逻辑
//! - `operations`: 其他操作（list, search, run, uninstall）
//! - `desktop`: 桌面快捷方式集成

mod models;
mod error_codes;
mod json_parser;
mod state_machine;
mod slot;
mod progress_emitter;
mod installer;
pub(crate) mod operations;
mod desktop;

// 重新导出公共 API
pub use models::InstalledApp;
// 供 process.rs 等跨模块复用的解析工具
pub(crate) use models::{LLCliListItem, arch_to_string};
pub use installer::{install_linglong_app, cancel_linglong_install};
pub use desktop::create_desktop_shortcut;
pub use operations::{
    get_installed_apps,
    uninstall_linglong_app,
    search_app_versions,
    run_linglong_app,
};
