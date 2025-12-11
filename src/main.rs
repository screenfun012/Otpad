// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod excel;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::generate_waste_data,
            commands::calculate_storage_state,
            commands::export_to_excel,
            commands::save_config,
            commands::load_configs,
            commands::get_month_data,
            commands::save_month_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
