//! 数据模型定义
//!
//! 本模块定义了安装相关的核心数据结构，
//! 包括 ll-cli JSON 输出的通用解析工具（arch 字段处理等）。

use serde::{Deserialize, Serialize};

/// 已安装的玲珑应用信息
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    /// 应用 ID（如 org.deepin.calculator）
    pub app_id: String,
    /// 应用名称
    pub name: String,
    /// 版本号
    pub version: String,
    /// 架构（如 x86_64, arm64）
    pub arch: String,
    /// 频道（如 stable, beta）
    pub channel: String,
    /// 应用描述
    pub description: String,
    /// 图标 URL
    pub icon: String,
    /// 应用类型（app, runtime, base）
    pub kind: Option<String>,
    /// 模块名
    pub module: String,
    /// 运行时依赖
    pub runtime: String,
    /// 应用大小
    pub size: String,
    /// 仓库名称
    pub repo_name: String,
}

/// 安装进度事件数据结构
///
/// 统一的 install-progress 事件，根据 eventType 区分不同类型：
/// - "progress": 进度更新事件
/// - "error": 错误事件
/// - "message": 消息事件
/// - "cancelled": 取消事件
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    /// 应用 ID
    pub app_id: String,
    /// 事件类型: "progress" | "error" | "message" | "cancelled"
    pub event_type: String,
    /// 原始消息文本
    pub message: String,
    /// 百分比数值 (0-100)，仅 progress 事件有效
    pub percentage: u32,
    /// 状态描述（用户友好的状态文本）
    pub status: String,
    /// 错误码，仅 error 事件有效
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<i32>,
    /// 错误详情（后端原始消息），用于折叠展示
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_detail: Option<String>,
}

/// ll-cli list 命令的 JSON 输出项
#[derive(Debug, Deserialize)]
pub(crate) struct LLCliListItem {
    #[serde(alias = "id", alias = "appid", alias = "appId")]
    pub app_id: Option<String>,
    pub name: String,
    pub version: String,
    pub arch: serde_json::Value, // 可能是字符串或数组
    pub channel: String,
    pub description: Option<String>,
    pub kind: Option<String>,
    pub module: Option<String>,
    pub runtime: Option<String>,
    pub size: Option<serde_json::Value>,
}

/// 将 ll-cli JSON 中的 arch 字段统一转换为字符串。
///
/// ll-cli 输出的 arch 可能是字符串 `"x86_64"` 或数组 `["x86_64"]`，
/// 本函数统一处理两种情况，供所有解析 ll-cli list/search 输出的地方复用。
pub(crate) fn arch_to_string(arch: &serde_json::Value) -> String {
    match arch {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Array(arr) => arr
            .iter()
            .filter_map(|v| v.as_str())
            .collect::<Vec<_>>()
            .join(", "),
        _ => String::new(),
    }
}

impl LLCliListItem {
    /// 将 LLCliListItem 转换为 InstalledApp
    pub fn into_installed_app(self) -> InstalledApp {
        let arch = arch_to_string(&self.arch);

        // 处理 size 字段
        let size = match self.size {
            Some(serde_json::Value::String(s)) => s,
            Some(serde_json::Value::Number(n)) => n.to_string(),
            _ => "0".to_string(),
        };

        InstalledApp {
            app_id: self.app_id.unwrap_or_else(|| self.name.clone()),
            name: self.name,
            version: self.version,
            arch,
            channel: self.channel,
            description: self.description.unwrap_or_default(),
            icon: String::new(), // 默认为空，后续从服务器获取
            kind: self.kind,
            module: self.module.unwrap_or_default(),
            runtime: self.runtime.unwrap_or_default(),
            size,
            repo_name: "stable".to_string(), // 默认仓库
        }
    }
}
