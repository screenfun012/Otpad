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
                    storage_state: current_storage, // Weekend keeps same storage
                });
                continue;
            }

            // Generate number from 0.0001 to 0.0007 (incrementing)
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            let mut hasher = DefaultHasher::new();
            (year, month, day).hash(&mut hasher);
            let hash = hasher.finish();
            // Generate value from 0.0001 to 0.0007 (1 to 7, then divide by 10000)
            let value = ((hash % 7) + 1) as f64 / 10000.0; // 0.0001 to 0.0007

            // Update storage: add produced value
            current_storage += value;

            days.push(DayData {
                date: date_str,
                produced: value,
                delivered: 0.0,
                storage_state: current_storage, // Storage after adding produced
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
    output_path: Option<String>,
    outputPath: Option<String>,
) -> Result<(), String> {
    // Support both naming conventions
    let path = output_path.or(outputPath)
        .ok_or("Missing output_path parameter")?;
    println!("export_to_excel called with path: {}", path);
    println!("Data: year={}, month={}, days={}", data.config.year, data.config.month, data.days.len());
    crate::excel::export_to_excel(&data, PathBuf::from(path))
}

#[tauri::command]
pub fn export_year_to_excel(
    months: Vec<MonthData>,
    output_path: Option<String>,
    outputPath: Option<String>,
) -> Result<(), String> {
    let path = output_path.or(outputPath)
        .ok_or("Missing output_path parameter")?;
    println!("export_year_to_excel called with path: {}", path);
    println!("Exporting {} months", months.len());
    crate::excel::export_year_to_excel(&months, PathBuf::from(path))
}

#[tauri::command]
pub fn import_from_excel(
    file_path: Option<String>,
    filePath: Option<String>,
) -> Result<Vec<MonthData>, String> {
    let path = file_path.or(filePath)
        .ok_or("Missing file_path parameter")?;
    println!("import_from_excel called with path: {}", path);
    crate::excel_import::import_from_excel(PathBuf::from(path))
}

#[tauri::command]
pub fn generate_produced_column(
    year: i32,
    month: u32,
) -> Result<Vec<f64>, String> {
    use chrono::{Datelike, NaiveDate, Weekday};
    
    let start_date = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or("Invalid date")?;
    
    let days_in_month = start_date
        .with_day(1)
        .and_then(|d| d.with_month(month + 1))
        .and_then(|d| d.pred_opt())
        .map(|d| d.day())
        .unwrap_or(28);

    let mut values = Vec::new();

    for day in 1..=days_in_month {
        if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
            let weekday = date.weekday();
            
            // Weekends get 0.0
            if weekday == Weekday::Sat || weekday == Weekday::Sun {
                values.push(0.0);
                continue;
            }

            // Generate number from 0.0001 to 0.0007
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            let mut hasher = DefaultHasher::new();
            (year, month, day).hash(&mut hasher);
            let hash = hasher.finish();
            let value = ((hash % 7) + 1) as f64 / 10000.0; // 0.0001 to 0.0007
            values.push(value);
        } else {
            values.push(0.0);
        }
    }

    Ok(values)
}

#[tauri::command]
pub fn generate_year_data(
    year: i32,
    initial_storage: f64,
) -> Result<Vec<MonthData>, String> {
    let mut months = Vec::new();
    let mut current_storage = initial_storage;

    for month in 1..=12 {
        let days = generate_waste_data(year, month, current_storage)?;
        
        // Calculate final storage for this month (last day's storage_state)
        let final_storage = if let Some(last_day) = days.last() {
            last_day.storage_state
        } else {
            current_storage
        };
        
        let config = WasteConfig {
            id: format!("{}_{:02}", year, month),
            year,
            month,
            index_number: "170402".to_string(),
            waste_name: "Отпадни алуминијум".to_string(),
            waste_description: "неопасан отпад".to_string(),
            record_keeper: "Наташа Јевтић".to_string(),
        };

        months.push(MonthData {
            config,
            days,
            initial_storage: current_storage,
        });

        // Next month starts with this month's final storage
        current_storage = final_storage;
    }

    Ok(months)
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

#[tauri::command]
pub fn get_home_dir() -> String {
    dirs::home_dir()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "/tmp".to_string())
}

