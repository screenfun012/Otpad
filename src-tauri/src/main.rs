// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod excel;
mod excel_import;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::generate_waste_data,
            commands::calculate_storage_state,
            commands::export_to_excel,
            commands::export_year_to_excel,
            commands::import_from_excel,
            commands::save_config,
            commands::load_configs,
            commands::get_month_data,
            commands::save_month_data,
            commands::generate_produced_column,
            commands::generate_year_data,
            commands::regenerate_month_random,
            commands::get_home_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
