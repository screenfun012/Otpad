use crate::commands::{DayData, MonthData, WasteConfig};
use calamine::{open_workbook, Reader, Xlsx};
use std::path::PathBuf;

pub fn import_from_excel(file_path: PathBuf) -> Result<Vec<MonthData>, String> {
    let mut workbook: Xlsx<_> = open_workbook(&file_path)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;

    let range = workbook
        .worksheet_range_at(0)
        .ok_or("No worksheet found")?
        .map_err(|e| format!("Failed to read worksheet: {}", e))?;

    let mut months = Vec::new();
    let mut current_row = 0;
    let max_row = range.height();

    while current_row < max_row {
        // Look for year field (row with "Година" in column B)
        if let Some(year_row) = find_year_row(&range, current_row) {
            if let Some(month_data) = parse_month_data(&range, year_row)? {
                let days_len = month_data.days.len();
                months.push(month_data);
                current_row = days_len + year_row + 20; // Skip to next month
            } else {
                current_row += 1;
            }
        } else {
            current_row += 1;
        }
    }

    Ok(months)
}

fn find_year_row(range: &calamine::Range<calamine::Data>, start_row: usize) -> Option<usize> {
    for row in start_row..range.height() {
        if let Some(cell) = range.get((row, 1)) {
            if let calamine::Data::String(s) = cell {
                if s.trim() == "Година" {
                    return Some(row);
                }
            }
        }
    }
    None
}

fn parse_month_data(range: &calamine::Range<calamine::Data>, start_row: usize) -> Result<Option<MonthData>, String> {
    // Parse header fields
    let year = get_cell_value(range, start_row, 5)
        .and_then(|v| v.parse::<i32>().ok())
        .ok_or("Failed to parse year")?;

    let month_name = get_cell_value(range, start_row + 2, 5)
        .ok_or("Failed to parse month")?;
    let month = month_name_to_number(&month_name)?;

    let index_number = get_cell_value(range, start_row + 4, 5)
        .unwrap_or_else(|| "170402".to_string());

    let waste_name = get_cell_value(range, start_row + 6, 5)
        .unwrap_or_else(|| "Отпадни алуминијум".to_string());

    let waste_description = get_cell_value(range, start_row + 8, 5)
        .unwrap_or_else(|| "неопасан отпад".to_string());

    let record_keeper = get_cell_value(range, start_row + 10, 5)
        .unwrap_or_else(|| "Наташа Јевтић".to_string());

    let config = WasteConfig {
        id: format!("{}_{:02}", year, month),
        year,
        month,
        index_number,
        waste_name,
        waste_description,
        record_keeper,
    };

    // Find data start row (row with "Датум" header)
    let data_start_row = find_data_start_row(range, start_row + 15)?;
    
    // Parse days
    let mut days = Vec::new();
    let mut row = data_start_row + 1;
    let mut initial_storage = 0.0;

    while row < range.height() {
        let date_cell = range.get((row, 0));
        if let Some(calamine::Data::String(date_str)) = date_cell {
            if date_str.trim() == "Укупно" || date_str.trim().is_empty() {
                break;
            }

            let produced = get_cell_value(range, row, 1)
                .and_then(|v| v.parse::<f64>().ok())
                .unwrap_or(0.0);

            let delivered = get_cell_value(range, row, 2)
                .and_then(|v| v.parse::<f64>().ok())
                .unwrap_or(0.0);

            let storage_state = get_cell_value(range, row, 3)
                .and_then(|v| v.parse::<f64>().ok())
                .unwrap_or(0.0);

            if row == data_start_row + 1 {
                // First row - calculate initial storage
                initial_storage = storage_state - produced;
            }

            days.push(DayData {
                date: date_str.trim().to_string(),
                produced,
                delivered,
                storage_state,
            });
        } else if date_cell.is_none() {
            break;
        }
        row += 1;
    }

    if days.is_empty() {
        return Ok(None);
    }

    Ok(Some(MonthData {
        config,
        days,
        initial_storage,
    }))
}

fn find_data_start_row(range: &calamine::Range<calamine::Data>, start_row: usize) -> Result<usize, String> {
    for row in start_row..range.height() {
        if let Some(cell) = range.get((row, 0)) {
            if let calamine::Data::String(s) = cell {
                if s.trim() == "Датум" {
                    return Ok(row);
                }
            }
        }
    }
    Err("Could not find data start row".to_string())
}

fn get_cell_value(range: &calamine::Range<calamine::Data>, row: usize, col: usize) -> Option<String> {
    range.get((row, col)).and_then(|cell| match cell {
        calamine::Data::String(s) => Some(s.clone()),
        calamine::Data::Float(f) => Some(f.to_string()),
        calamine::Data::Int(i) => Some(i.to_string()),
        calamine::Data::Bool(b) => Some(b.to_string()),
        _ => None,
    })
}

fn month_name_to_number(name: &str) -> Result<u32, String> {
    let months = [
        ("Јануар", 1), ("Фебруар", 2), ("Март", 3), ("Април", 4),
        ("Мај", 5), ("Јун", 6), ("Јул", 7), ("Август", 8),
        ("Септембар", 9), ("Октобар", 10), ("Новембар", 11), ("Децембар", 12),
    ];
    
    for (month_name, num) in &months {
        if name.trim() == *month_name {
            return Ok(*num);
        }
    }
    Err(format!("Unknown month: {}", name))
}

