mod services;

use services::network::{get_network_speed as network_get_speed, NetworkSpeed};
use services::process::{get_running_linglong_apps as process_get_running_apps, kill_linglong_app as process_kill_app, LinglongAppInfo};
use services::installed::{
    get_installed_apps,
    uninstall_linglong_app,
    search_app_versions,
    run_linglong_app,
    install_linglong_app,
    cancel_install_app,
    InstalledApp,
};
use services::linglong::{search_remote_app, get_ll_cli_version, SearchResultItem};
pub mod modules;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn search_remote_app_cmd(app_id: String) -> Result<Vec<SearchResultItem>, String> {
    search_remote_app(app_id).await
}

#[tauri::command]
async fn get_ll_cli_version_cmd() -> Result<String, String> {
    get_ll_cli_version().await
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
async fn get_installed_linglong_apps(include_base_service: bool) -> Result<Vec<InstalledApp>, String> {
    get_installed_apps(include_base_service).await
}

#[tauri::command]
async fn uninstall_app(app_id: String, version: String) -> Result<String, String> {
    uninstall_linglong_app(app_id, version).await
}

#[tauri::command]
async fn search_versions(app_id: String) -> Result<Vec<InstalledApp>, String> {
    search_app_versions(app_id).await
}

#[tauri::command]
async fn run_app(app_id: String) -> Result<String, String> {
    run_linglong_app(app_id).await
}

#[tauri::command]
async fn install_app(
    app_handle: tauri::AppHandle,
    app_id: String,
    version: Option<String>,
    force: bool
) -> Result<String, String> {
    println!("[install_app] Command invoked: app_id={}, version={:?}, force={}", app_id, version, force);
    let result = install_linglong_app(app_handle, app_id.clone(), version, force).await;
    println!("[install_app] Command result for {}: {:?}", app_id, result);
    result
}

#[tauri::command]
async fn cancel_install(app_handle: tauri::AppHandle, app_id: String) -> Result<String, String> {
    println!("[cancel_install] Command invoked: app_id={}", app_id);
    let result = cancel_install_app(app_handle, app_id.clone()).await;
    println!("[cancel_install] Command result for {}: {:?}", app_id, result);
    result
}

pub fn run() {
    let system_tray = modules::tray::create_system_tray();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .system_tray(system_tray)
        .on_system_tray_event(modules::tray::handle_tray_event)
        .invoke_handler(tauri::generate_handler![
            greet,
            get_network_speed,
            get_running_linglong_apps,
            kill_linglong_app,
            get_installed_linglong_apps,
            uninstall_app,
            search_versions,
            run_app,
            install_app,
            cancel_install,
            search_remote_app_cmd,
            get_ll_cli_version_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
