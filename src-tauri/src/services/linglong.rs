use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::services::executor;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultItem {
    #[serde(alias = "id", alias = "appid", alias = "appId")]
    pub app_id: Option<String>,
    pub name: String,
    pub version: String,
    pub arch: Option<serde_json::Value>,
    pub description: Option<String>,
    pub module: Option<String>,
    pub icon: Option<String>,
}

pub async fn search_remote_app(app_id: String) -> Result<Vec<SearchResultItem>, String> {
    let stdout = executor::execute_or_err(
        &["search", &app_id, "--json"],
        "search",
    ).await?;

    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    // Try parsing as a map first (e.g. {"stable": [...]})
    if let Ok(map) = serde_json::from_str::<HashMap<String, Vec<SearchResultItem>>>(trimmed) {
        let mut all_results = Vec::new();
        for (_, items) in map {
            all_results.extend(items);
        }
        return Ok(all_results);
    }

    // Fallback to array parsing
    let search_results: Vec<SearchResultItem> = serde_json::from_str(trimmed)
        .map_err(|e| format!("Failed to parse search result: {}", e))?;

    Ok(search_results)
}

pub async fn get_ll_cli_version() -> Result<String, String> {
    crate::services::linglong_env::get_ll_cli_version().await
}
