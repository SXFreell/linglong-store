//! 玲珑环境检测 — 解析工具
//!
//! 本模块集中了 ll-cli 版本解析、仓库输出解析、glibc 版本解析、
//! 版本号比较等纯函数，供 `linglong_env` 主模块调用。

use std::collections::HashMap;

use super::linglong_env::{LinglongEnvCheckResult, LinglongRepo};

/// 解析 `ll-cli repo show` 的文本输出，提取仓库列表和默认仓库名
pub(crate) fn parse_repo_output(output: &str) -> LinglongEnvCheckResult {
    let lines: Vec<&str> = output.lines().filter(|l| !l.trim().is_empty()).collect();
    if lines.is_empty() {
        return LinglongEnvCheckResult {
            ok: false,
            reason: Some("未检测到仓库信息".to_string()),
            ..Default::default()
        };
    }

    let default_repo = lines
        .get(0)
        .and_then(|l| l.split(':').nth(1))
        .map(|s| s.trim().to_string());
    let repo_lines = if lines.len() > 2 { &lines[2..] } else { &[] };
    let mut repos = Vec::new();
    for line in repo_lines {
        let parts: Vec<&str> = line.trim().split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }
        let name = parts.get(0).unwrap_or(&"").to_string();
        let url = parts.get(1).unwrap_or(&"").to_string();
        let alias = parts.get(2).map(|s| s.to_string());
        let priority = parts.get(3).map(|s| s.to_string());
        repos.push(LinglongRepo {
            name,
            url,
            alias,
            priority,
        });
    }

    LinglongEnvCheckResult {
        ok: !repos.is_empty(),
        reason: None,
        repo_name: default_repo,
        repos,
        ..Default::default()
    }
}

/// 从 ll-cli --json --version 的输出中提取版本号
pub(crate) fn parse_ll_version(raw: &str) -> Option<String> {
    if raw.trim().is_empty() {
        return None;
    }
    // 尝试 JSON 格式 {"version": "1.7.3"}
    if let Ok(json) = serde_json::from_str::<HashMap<String, String>>(raw) {
        if let Some(v) = json.get("version") {
            return Some(v.trim().to_string());
        }
    }
    // 回退：从原始文本中提取版本号片段
    let cleaned = raw.trim();
    cleaned
        .split(|c: char| !(c.is_ascii_digit() || c == '.'))
        .find(|seg| seg.contains('.') && !seg.is_empty())
        .map(|seg| seg.to_string())
}

/// 从 ldd --version 的输出中提取 glibc 版本号
pub(crate) fn parse_glibc_version(raw: &str) -> Option<String> {
    if raw.trim().is_empty() {
        return None;
    }
    let first_line = raw.lines().next().unwrap_or("").trim();
    if first_line.is_empty() {
        return None;
    }

    // 从首行末尾找到形如 2.35 的版本号
    if let Some(token) = first_line
        .split_whitespace()
        .rev()
        .find(|part| part.chars().all(|c| c.is_ascii_digit() || c == '.'))
    {
        if token.contains('.') {
            return Some(token.to_string());
        }
    }

    Some(first_line.to_string())
}

/// 比较两个版本号字符串
pub(crate) fn compare_versions(v1: &str, v2: &str) -> std::cmp::Ordering {
    let to_parts = |v: &str| -> Vec<i32> {
        v.split(|c| c == '.' || c == '-' || c == '_')
            .filter_map(|p| p.parse::<i32>().ok())
            .collect()
    };
    let a = to_parts(v1);
    let b = to_parts(v2);
    let len = a.len().max(b.len());
    for i in 0..len {
        let av = *a.get(i).unwrap_or(&0);
        let bv = *b.get(i).unwrap_or(&0);
        match av.cmp(&bv) {
            std::cmp::Ordering::Equal => continue,
            ord => return ord,
        }
    }
    std::cmp::Ordering::Equal
}
