use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WasteConfig {
    pub id: String,
    pub year: i32,
    pub month: u32,
    pub index_number: String,
    pub waste_name: String,
    pub waste_description: String,
    pub record_keeper: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DayData {
    pub date: String,
    pub produced: f64,
    pub delivered: f64,
    pub storage_state: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthData {
    pub config: WasteConfig,
    pub days: Vec<DayData>,
    pub initial_storage: f64,
}

#[tauri::command]
pub fn generate_waste_data(
    year: i32,
    month: u32,
    initial_storage: f64,
) -> Result<Vec<DayData>, String> {
    use chrono::{Datelike, NaiveDate, Weekday};

    let start_date = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or("Invalid date")?;
    
    let days_in_month = start_date
        .with_day(1)
        .and_then(|d| d.with_month(month + 1))
        .and_then(|d| d.pred_opt())
        .map(|d| d.day())
        .unwrap_or(28);

    let mut days = Vec::new();
    let mut current_storage = initial_storage;

    for day in 1..=days_in_month {
        if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
            let weekday = date.weekday();
            
            let date_str = format!("{:02}.{:02}.", day, month);
            
            // Skip weekends (Saturday = 6, Sunday = 7)
            if weekday == Weekday::Sat || weekday == Weekday::Sun {
                days.push(DayData {
                    date: date_str,
                    produced: 0.0,
                    delivered: 0.0,
                    storage_state: current_storage,
                });
                continue;
            }

            // Generate random number between 0 and 0.0007
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            let mut hasher = DefaultHasher::new();
            (year, month, day).hash(&mut hasher);
            let hash = hasher.finish();
            let random = (hash % 8000) as f64 / 10000000.0; // 0 to 0.0007

            current_storage += random;

            days.push(DayData {
                date: date_str,
                produced: random,
                delivered: 0.0,
                storage_state: current_storage,
            });
        }
    }

    Ok(days)
}

#[tauri::command]
pub fn calculate_storage_state(
    initial_storage: f64,
    produced_values: Vec<f64>,
) -> Result<Vec<f64>, String> {
    let mut storage_states = Vec::new();
    let mut current = initial_storage;

    for produced in produced_values {
        current += produced;
        storage_states.push(current);
    }

    Ok(storage_states)
}

#[tauri::command]
pub fn save_config(config: WasteConfig) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

    let file_path = config_dir.join(format!("{}.json", config.id));
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn load_configs() -> Result<Vec<WasteConfig>, String> {
    let config_dir = get_config_dir()?;
    
    if !config_dir.exists() {
        return Ok(Vec::new());
    }

    let mut configs = Vec::new();
    
    for entry in fs::read_dir(&config_dir)
        .map_err(|e| format!("Failed to read config dir: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(config) = serde_json::from_str::<WasteConfig>(&content) {
                    configs.push(config);
                }
            }
        }
    }

    Ok(configs)
}

#[tauri::command]
pub fn get_month_data(year: i32, month: u32) -> Result<Option<MonthData>, String> {
    let data_dir = get_data_dir()?;
    let file_path = data_dir.join(format!("{}_{:02}.json", year, month));
    
    if !file_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read month data: {}", e))?;
    
    let data: MonthData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse month data: {}", e))?;

    Ok(Some(data))
}

#[tauri::command]
pub fn save_month_data(data: MonthData) -> Result<(), String> {
    let data_dir = get_data_dir()?;
    fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create data dir: {}", e))?;

    let file_path = data_dir.join(format!("{}_{:02}.json", data.config.year, data.config.month));
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize month data: {}", e))?;

    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to write month data: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn export_to_excel(
    data: MonthData,
    output_path: String,
) -> Result<(), String> {
    crate::excel::export_to_excel(&data, PathBuf::from(output_path))
}

fn get_config_dir() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir()
        .ok_or("Failed to get home directory")?;
    path.push(".waste-evidence-app");
    path.push("configs");
    Ok(path)
}

fn get_data_dir() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir()
        .ok_or("Failed to get home directory")?;
    path.push(".waste-evidence-app");
    path.push("data");
    Ok(path)
}

