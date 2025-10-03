mod services;

use services::network::{get_network_speed as network_get_speed, NetworkSpeed};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_network_speed() -> Result<NetworkSpeed, String> {
    network_get_speed().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_zustand::init())
        .invoke_handler(tauri::generate_handler![greet, get_network_speed])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
