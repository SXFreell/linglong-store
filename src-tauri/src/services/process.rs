use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LinglongAppInfo {
    pub name: String,
    pub version: String,
    pub arch: String,
    pub channel: String,
    pub source: String,
    pub pid: String,
    pub container_id: String,
}

#[derive(Debug, Deserialize)]
struct AppInfoJson {
    arch: Vec<String>,
    channel: String,
    id: String,
    version: String,
    base: String,
}

pub async fn get_running_linglong_apps() -> Result<Vec<LinglongAppInfo>, String> {
    let ps_output = Command::new("ll-cli")
        .arg("ps")
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli ps': {}", e))?;

    if !ps_output.status.success() {
        return Err(format!(
            "ll-cli ps command failed with status: {}",
            ps_output.status
        ));
    }

    let ps_string = String::from_utf8_lossy(&ps_output.stdout);
    let mut apps = Vec::new();

    // Skip header line
    for line in ps_string.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 3 {
            let app_name = parts[0];
            let container_id = parts[1];
            let pid = parts[2];

            let info_output = Command::new("ll-cli")
                .arg("info")
                .arg(app_name)
                .output()
                .map_err(|e| format!("Failed to execute 'll-cli info {}': {}", app_name, e))?;

            if info_output.status.success() {
                let info_string = String::from_utf8_lossy(&info_output.stdout);
                if let Ok(info_json) = serde_json::from_str::<AppInfoJson>(&info_string) {
                    let source = info_json.base.split(':').next().unwrap_or("").to_string();
                    apps.push(LinglongAppInfo {
                        name: info_json.id,
                        version: info_json.version,
                        arch: info_json.arch.join(", "),
                        channel: info_json.channel,
                        source,
                        pid: pid.to_string(),
                        container_id: container_id.to_string(),
                    });
                }
            }
        }
    }

    Ok(apps)
}

pub async fn kill_linglong_app(app_name: String) -> Result<String, String> {
    let output = Command::new("ll-cli")
        .arg("kill")
        .arg(&app_name)
        .output()
        .map_err(|e| format!("Failed to execute 'll-cli kill': {}", e))?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ll-cli kill command failed: {}", error_msg));
    }

    Ok(format!("Successfully stopped {}", app_name))
}
