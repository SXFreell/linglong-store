mod services;

use services::network::{get_network_speed as network_get_speed, NetworkSpeed};
use services::process::{get_running_linglong_apps as process_get_running_apps, kill_linglong_app as process_kill_app, LinglongAppInfo};
use services::installed::{get_installed_apps, get_all_installed_apps, InstalledApp};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_network_speed() -> Result<NetworkSpeed, String> {
    network_get_speed().await
}

#[tauri::command]
async fn get_running_linglong_apps() -> Result<Vec<LinglongAppInfo>, String> {
    process_get_running_apps().await
}

#[tauri::command]
async fn kill_linglong_app(app_name: String) -> Result<String, String> {
    process_kill_app(app_name).await
}

#[tauri::command]
async fn get_installed_linglong_apps() -> Result<Vec<InstalledApp>, String> {
    get_installed_apps().await
}

#[tauri::command]
async fn get_all_installed_linglong_apps() -> Result<Vec<InstalledApp>, String> {
    get_all_installed_apps().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_zustand::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_network_speed, 
            get_running_linglong_apps, 
            kill_linglong_app,
            get_installed_linglong_apps,
            get_all_installed_linglong_apps
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
