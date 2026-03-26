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
    /// Укупан износ из претходне године (т): расподела производње по месецима.
    #[serde(default)]
    pub yearly_carry_total: Option<f64>,
    /// Почетно стање (1. јануар, пре првог уноса) — ручно.
    #[serde(default)]
    pub year_start_storage: Option<f64>,
    /// Стање на последњи дан децембра (крај године) — ручно; користи се за усаглашавање колоне „Стање“.
    #[serde(default)]
    pub december_closing_storage: Option<f64>,
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

/// Poslednja radna vrednost u koloni „Произведена“ (Excel B) za mesec — za lančano nastavljanje u sledećem mesecu.
fn last_workday_produced(days: &[DayData]) -> Option<f64> {
    days
        .iter()
        .rev()
        .find(|d| d.produced > 0.0)
        .map(|d| d.produced)
}

fn round3(x: f64) -> f64 {
    (x * 1000.0).round() / 1000.0
}

#[inline]
fn nonneg3(x: f64) -> f64 {
    round3(x).max(0.0)
}

/// Минимално по **радном** дану (т) кад год има довољно месечног износа — да скоро сваки радни дан има нешто; викенди = 0.
const MIN_WEEKDAY_PRODUCED_T: f64 = 0.001;

/// Deli `month_total` na radne dane; opciono prvi dan = carry iz prethodnog meseca.
fn distribute_month_production(
    year: i32,
    month: u32,
    weekday_count: usize,
    month_total: f64,
    carry_first: Option<f64>,
) -> Result<Vec<f64>, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    if weekday_count == 0 {
        return Ok(vec![]);
    }
    if month_total < 0.0 {
        return Err("Monthly total must be non-negative".into());
    }

    if let Some(first) = carry_first {
        if first > month_total + 1e-9 {
            return Err("Prenos prelazi mesečni iznos".into());
        }
        if weekday_count == 1 {
            return Ok(vec![round3(month_total)]);
        }
        let rest_total = month_total - first;
        let mut rest_vec =
            distribute_month_production(year, month, weekday_count - 1, rest_total, None)?;
        let mut out = vec![round3(first)];
        out.append(&mut rest_vec);
        return Ok(out);
    }

    let n = weekday_count as f64;
    let min_floor = MIN_WEEKDAY_PRODUCED_T * n;

    // Премало за минимум на сваки радни дан: равномерно са исправком заокруживања
    if month_total + 1e-12 < min_floor {
        let mut raw = vec![0.0f64; weekday_count];
        for i in 0..weekday_count.saturating_sub(1) {
            raw[i] = round3(month_total / n);
        }
        let sum_so_far: f64 = raw[..weekday_count.saturating_sub(1)].iter().sum();
        raw[weekday_count - 1] = round3(month_total - sum_so_far);
        return Ok(raw);
    }

    // Сваки радни дан бар MIN, остатак насумично по тежинама (варијација)
    let remaining = month_total - min_floor;
    let mut weights = vec![0.0f64; weekday_count];
    for i in 0..weekday_count {
        let mut hasher = DefaultHasher::new();
        (year, month, i as u32).hash(&mut hasher);
        let h = hasher.finish();
        weights[i] = 1.0 + (h % 10_000) as f64 / 10_000.0;
    }
    let wsum: f64 = weights.iter().sum();
    let mut raw: Vec<f64> = weights
        .iter()
        .map(|w| round3(MIN_WEEKDAY_PRODUCED_T + remaining * w / wsum))
        .collect();
    let sum_so_far: f64 = raw[..weekday_count.saturating_sub(1)].iter().sum();
    raw[weekday_count - 1] = nonneg3(month_total - sum_so_far);

    Ok(raw)
}

fn split_into_twelve_months(total: f64) -> [f64; 12] {
    let micro = (total * 1000.0).round() as i64;
    let base = micro / 12;
    let rem = (micro % 12) as usize;
    let mut out = [0.0f64; 12];
    for i in 0..12 {
        let micro_i = base + if i < rem { 1 } else { 0 };
        out[i] = micro_i as f64 / 1000.0;
    }
    out
}

/// Ista logika težina kao `distribute_month_production(year, 1, …)`, ali u **celim mikro-jedinicama**
/// (bez f64→i64 greške koja može učiniti poslednji segment negativnim).
fn distribute_year_delta_micros(year: i32, n: usize, delta_micro: i64) -> Result<Vec<i64>, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    const MIN_MICRO: i64 = 1;

    if n == 0 {
        return Err("Nema radnih dana u godini za raspodelu".into());
    }
    if delta_micro <= 0 {
        return Ok(vec![0i64; n]);
    }

    let min_floor = MIN_MICRO * n as i64;
    if delta_micro < min_floor {
        // Ne gurati ostatak na prve radne dane u godini (to je praktično samo januar).
        // Ravnomerno „razvuci“ dodatak kroz celu godinu (isti zbir, meseci približno podjednako).
        let mut micros = vec![0i64; n];
        let base = delta_micro / n as i64;
        let rem = (delta_micro % n as i64) as usize;
        for i in 0..n {
            micros[i] = base;
        }
        if rem > 0 {
            for k in 0..rem {
                let idx = (k * n) / rem;
                micros[idx] += 1;
            }
        }
        debug_assert_eq!(micros.iter().sum::<i64>(), delta_micro);
        return Ok(micros);
    }

    let remaining = delta_micro - min_floor;
    let mut weights = vec![0.0f64; n];
    for i in 0..n {
        let mut hasher = DefaultHasher::new();
        (year, 1u32, i as u32).hash(&mut hasher);
        let h = hasher.finish();
        weights[i] = 1.0 + (h % 10_000) as f64 / 10_000.0;
    }
    let wsum: f64 = weights.iter().sum();

    let mut extras = vec![0i64; n];
    let mut fractions: Vec<(usize, f64)> = Vec::with_capacity(n);
    let mut sum_floor = 0i64;
    for i in 0..n {
        let exact = remaining as f64 * weights[i] / wsum;
        let fl = exact.floor() as i64;
        extras[i] = fl;
        sum_floor += fl;
        fractions.push((i, exact - fl as f64));
    }

    let mut leftover = remaining - sum_floor;
    fractions.sort_by(|a, b| b.1.total_cmp(&a.1));
    let mut j = 0usize;
    while leftover > 0 {
        let idx = fractions[j % n].0;
        extras[idx] += 1;
        leftover -= 1;
        j += 1;
    }

    let micros: Vec<i64> = extras.iter().map(|&e| MIN_MICRO + e).collect();
    debug_assert_eq!(micros.iter().sum::<i64>(), delta_micro);
    Ok(micros)
}

/// `carry_first_produced`: poslednji broj iz prethodnog meseca (samo „слободан“ режим).
/// `monthly_produced_target`: сума „Произведена“ за овај месец (режим расподеле).
#[tauri::command]
pub fn generate_waste_data(
    year: i32,
    month: u32,
    initial_storage: f64,
    carry_first_produced: Option<f64>,
    monthly_produced_target: Option<f64>,
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

    struct DaySlot {
        date_str: String,
        is_weekend: bool,
        day: u32,
    }

    let mut slots = Vec::new();
    for day in 1..=days_in_month {
        if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
            let weekday = date.weekday();
            let date_str = format!("{:02}.{:02}.", day, month);
            let is_weekend = weekday == Weekday::Sat || weekday == Weekday::Sun;
            slots.push(DaySlot {
                date_str,
                is_weekend,
                day,
            });
        }
    }

    let weekday_indices: Vec<usize> = slots
        .iter()
        .enumerate()
        .filter(|(_, s)| !s.is_weekend)
        .map(|(i, _)| i)
        .collect();
    let n = weekday_indices.len();

    let mut produced_by_slot: Vec<Option<f64>> = vec![None; slots.len()];

    if let Some(m) = monthly_produced_target {
        if n == 0 {
            return Err("Nema radnih dana u mesecu".into());
        }
        let vals = distribute_month_production(year, month, n, m, None)?;
        for (idx, &slot_i) in weekday_indices.iter().enumerate() {
            produced_by_slot[slot_i] = Some(vals[idx]);
        }
    } else {
        let mut carry = carry_first_produced;
        for &slot_i in &weekday_indices {
            let value = if let Some(v) = carry.take() {
                v
            } else {
                use std::collections::hash_map::DefaultHasher;
                use std::hash::{Hash, Hasher};
                let mut hasher = DefaultHasher::new();
                (year, month, slots[slot_i].day).hash(&mut hasher);
                let hash = hasher.finish();
                ((hash % 7) + 1) as f64 / 1000.0
            };
            produced_by_slot[slot_i] = Some(value);
        }
    }

    let mut days = Vec::new();
    let mut current_storage = nonneg3(initial_storage);

    for (i, slot) in slots.iter().enumerate() {
        if slot.is_weekend {
            days.push(DayData {
                date: slot.date_str.clone(),
                produced: 0.0,
                delivered: 0.0,
                storage_state: current_storage,
            });
        } else {
            let p = nonneg3(produced_by_slot[i].unwrap_or(0.0));
            current_storage = nonneg3(current_storage + p);
            days.push(DayData {
                date: slot.date_str.clone(),
                produced: p,
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
    let mut current = nonneg3(initial_storage);

    for produced in produced_values {
        current = nonneg3(current + nonneg3(produced));
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
pub fn delete_config(config_id: String) -> Result<(), String> {
    if config_id.is_empty()
        || config_id.contains('/')
        || config_id.contains('\\')
        || config_id.contains("..")
    {
        return Err("Nevažeći ID konfiguracije.".to_string());
    }
    let config_dir = get_config_dir()?;
    let file_path = config_dir.join(format!("{}.json", config_id));
    if !file_path.exists() {
        return Err("Konfiguracija nije pronađena.".to_string());
    }
    fs::remove_file(&file_path).map_err(|e| format!("Brisanje konfiguracije: {}", e))?;
    Ok(())
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
    carry_first_produced: Option<f64>,
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
    let mut carry = carry_first_produced;

    for day in 1..=days_in_month {
        if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
            let weekday = date.weekday();
            
            if weekday == Weekday::Sat || weekday == Weekday::Sun {
                values.push(0.0);
                continue;
            }

            let value = if let Some(v) = carry.take() {
                v
            } else {
                use std::collections::hash_map::DefaultHasher;
                use std::hash::{Hash, Hasher};
                let mut hasher = DefaultHasher::new();
                (year, month, day).hash(&mut hasher);
                let hash = hasher.finish();
                ((hash % 7) + 1) as f64 / 1000.0
            };
            values.push(value);
        } else {
            values.push(0.0);
        }
    }

    Ok(values)
}

/// Да ли је датум (формат „ДД.ММ.“) викенд у датој години.
fn is_weekend_day(year: i32, date_str: &str) -> bool {
    use chrono::{Datelike, NaiveDate, Weekday};
    let parts: Vec<&str> = date_str
        .trim()
        .trim_end_matches('.')
        .split('.')
        .filter(|s| !s.is_empty())
        .collect();
    if parts.len() < 2 {
        return true;
    }
    let day: u32 = parts[0].parse().unwrap_or(0);
    let month: u32 = parts[1].parse().unwrap_or(0);
    if day == 0 || month == 0 {
        return true;
    }
    match NaiveDate::from_ymd_opt(year, month, day) {
        Some(date) => {
            let wd = date.weekday();
            wd == Weekday::Sat || wd == Weekday::Sun
        }
        // Nevažeći datum (npr. stari JSON): ne tretirati kao radni dan — inače se poremeti broj radnih dana i raspodela.
        None => true,
    }
}

/// Расподела укупне производње (крај − почетак) на **све радне дане** у години; викенди = 0.
/// Стање се води у целим микро-јединицама (1000 = 1 t) да крај године буде тачно као унет
/// (нпр. 1.640), без накупљања грешке од `round3` на сваком дану.
fn apply_year_storage_bounds(
    months: &mut Vec<MonthData>,
    year_start: f64,
    year_end: f64,
) -> Result<(), String> {
    let year_start = nonneg3(year_start);
    let year_end = nonneg3(year_end);
    if year_end + 1e-9 < year_start {
        return Err("Kraj decembra mora biti ≥ početka godine".into());
    }
    if months.is_empty() {
        return Ok(());
    }
    let year = months[0].config.year;

    let year_start_micro = (year_start * 1000.0).round() as i64;
    let year_end_micro = (year_end * 1000.0).round() as i64;
    let delta_micro = year_end_micro.saturating_sub(year_start_micro);

    let mut n = 0usize;
    for m in months.iter() {
        for d in &m.days {
            if !is_weekend_day(year, &d.date) {
                n += 1;
            }
        }
    }

    let micros: Vec<i64> = if delta_micro > 0 {
        distribute_year_delta_micros(year, n, delta_micro)?
    } else {
        vec![0i64; n]
    };

    let mut wi = 0usize;
    let mut cur_m = year_start_micro;

    for m in months.iter_mut() {
        m.initial_storage = cur_m as f64 / 1000.0;
        for d in &mut m.days {
            if is_weekend_day(year, &d.date) {
                d.produced = 0.0;
            } else {
                let pm = micros[wi];
                wi += 1;
                d.produced = pm as f64 / 1000.0;
                cur_m += pm;
            }
            d.storage_state = cur_m as f64 / 1000.0;
        }
    }

    debug_assert_eq!(wi, n);
    debug_assert_eq!(cur_m, year_end_micro);

    Ok(())
}

#[tauri::command]
pub fn generate_year_data(
    mut base_config: WasteConfig,
    year_start_storage: f64,
    yearly_carry_total: Option<f64>,
    december_closing_storage: Option<f64>,
) -> Result<Vec<MonthData>, String> {
    let year = base_config.year;
    let use_split = yearly_carry_total.map(|t| t > 1e-9).unwrap_or(false);

    let mut months = Vec::new();
    let mut current_storage: f64;
    let mut carry_first_produced: Option<f64> = None;

    if use_split {
        let t = yearly_carry_total.unwrap();
        current_storage = nonneg3(year_start_storage);
        let quotas = split_into_twelve_months(t);

        for month in 1..=12 {
            let days = generate_waste_data(
                year,
                month,
                current_storage,
                None,
                Some(quotas[month as usize - 1]),
            )?;
            let final_storage = days
                .last()
                .map(|d| d.storage_state)
                .unwrap_or(current_storage);

            base_config.month = month;
            base_config.year = year;
            base_config.id = format!("{}_{:02}", year, month);
            base_config.yearly_carry_total = Some(t);
            base_config.year_start_storage = Some(year_start_storage);
            base_config.december_closing_storage = december_closing_storage;

            months.push(MonthData {
                config: base_config.clone(),
                days,
                initial_storage: current_storage,
            });

            current_storage = final_storage;
        }
    } else {
        current_storage = nonneg3(year_start_storage);
        for month in 1..=12 {
            let days = generate_waste_data(year, month, current_storage, carry_first_produced, None)?;
            carry_first_produced = last_workday_produced(&days);
            let final_storage = days
                .last()
                .map(|d| d.storage_state)
                .unwrap_or(current_storage);

            base_config.month = month;
            base_config.year = year;
            base_config.id = format!("{}_{:02}", year, month);
            base_config.yearly_carry_total = None;
            base_config.year_start_storage = Some(year_start_storage);
            base_config.december_closing_storage = december_closing_storage;

            months.push(MonthData {
                config: base_config.clone(),
                days,
                initial_storage: current_storage,
            });

            current_storage = final_storage;
        }
    }

    if let Some(dec) = december_closing_storage {
        apply_year_storage_bounds(&mut months, year_start_storage, dec)?;
        for m in &mut months {
            m.config.year_start_storage = Some(year_start_storage);
            m.config.december_closing_storage = Some(dec);
        }
    }

    Ok(months)
}

/// Насумично поново генерише само један месец (расподела или слободан режим према config.yearly_carry_total).
#[tauri::command]
pub fn regenerate_month_random(
    config: WasteConfig,
    initial_storage: f64,
    carry_first_produced: Option<f64>,
) -> Result<MonthData, String> {
    let year = config.year;
    let month = config.month;
    let days = if let Some(t) = config.yearly_carry_total.filter(|x| *x > 1e-9) {
        let quotas = split_into_twelve_months(t);
        let q = quotas[month as usize - 1];
        generate_waste_data(year, month, initial_storage, None, Some(q))?
    } else {
        generate_waste_data(year, month, initial_storage, carry_first_produced, None)?
    };

    Ok(MonthData {
        config,
        days,
        initial_storage,
    })
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

