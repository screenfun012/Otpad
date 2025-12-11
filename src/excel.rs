use crate::commands::{DayData, MonthData, WasteConfig};
use rust_xlsxwriter::*;
use std::path::PathBuf;

pub fn export_to_excel(data: &MonthData, output_path: PathBuf) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Set column widths
    worksheet.set_column_width(0, 12.0)?;
    worksheet.set_column_width(1, 30.0)?;
    worksheet.set_column_width(2, 30.0)?;
    worksheet.set_column_width(3, 35.0)?;
    for col in 4..=16 {
        worksheet.set_column_width(col, 20.0)?;
    }

    // Header styles
    let header_format = Format::new()
        .set_background_color("#D9D9D9") // Gray background
        .set_font_name("Calibri")
        .set_font_size(10)
        .set_bold();

    let title_format = Format::new()
        .set_background_color("#D9D9D9")
        .set_font_name("Calibri")
        .set_font_size(11);

    let data_format = Format::new()
        .set_font_name("Calibri")
        .set_font_size(11);

    // Row 1: ПРИЛОГ 1.
    worksheet.write_with_format(0, 10, "ПРИЛОГ 1.", &data_format)?;

    // Row 2: ОБРАЗАЦ ДЕО 1
    worksheet.write_with_format(1, 10, "ОБРАЗАЦ ДЕО 1", &data_format)?;

    // Row 3: ДНЕВНА ЕВИДЕНЦИЈА О ОТПАДУ ПРОИЗВОЂАЧА ОТПАДА 1
    worksheet.write_with_format(2, 1, "ДНЕВНА ЕВИДЕНЦИЈА О ОТПАДУ ПРОИЗВОЂАЧА ОТПАДА 1", &data_format)?;

    // Row 5: Година
    worksheet.write_with_format(4, 1, "Година", &title_format)?;
    worksheet.write_with_format(4, 5, data.config.year, &data_format)?;

    // Row 7: Месец
    let month_names = [
        "", "Јануар", "Фебруар", "Март", "Април", "Мај", "Јун",
        "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"
    ];
    let month_name = if data.config.month <= 12 {
        month_names[data.config.month as usize]
    } else {
        ""
    };
    worksheet.write_with_format(6, 1, "Месец", &title_format)?;
    worksheet.write_with_format(6, 5, month_name, &data_format)?;

    // Row 9: Индексни број отпада из Каталога отпада
    worksheet.write_with_format(8, 1, "Индексни број отпада из Каталога отпада", &title_format)?;
    worksheet.write_with_format(8, 5, &data.config.index_number, &data_format)?;

    // Row 11: Назив отпада
    worksheet.write_with_format(10, 1, "Назив отпада", &title_format)?;
    worksheet.write_with_format(10, 5, &data.config.waste_name, &data_format)?;

    // Row 13: Опис отпада
    worksheet.write_with_format(12, 1, "Опис отпада", &title_format)?;
    worksheet.write_with_format(12, 5, &data.config.waste_description, &data_format)?;

    // Row 15: Евиденцију води
    worksheet.write_with_format(14, 1, "Евиденцију води (Име и презиме)", &title_format)?;
    worksheet.write_with_format(14, 5, &data.config.record_keeper, &data_format)?;

    // Row 18: Headers
    worksheet.write_with_format(17, 0, "ПРОИЗВЕДЕНЕ КОЛИЧИНЕ ОТАДА", &header_format)?;
    worksheet.write_with_format(17, 4, "ОТПАД ПРЕДАТ", &header_format)?;

    // Row 19: Column headers
    let headers = [
        "Датум",
        "Произведена количина отпада (т)",
        "Предата количина отпада (т)",
        "Стање на привременом складишту (т)",
        "Сакупљачу 2",
        "Оператеру на поновно искорићење 2",
        "R ознака",
        "Оператеру на одлагање 2",
        "D ознака",
        "Извоз 2",
        "Назив предузећа којем је отпад предат",
        "Број дозволе",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_with_format(18, col as u16, *header, &header_format)?;
    }

    // Data rows (starting from row 20, index 19)
    let mut start_row = 19;
    for day in &data.days {
        worksheet.write_with_format(start_row, 0, &day.date, &data_format)?;
        worksheet.write_with_format(start_row, 1, day.produced, &data_format)?;
        worksheet.write_with_format(start_row, 2, day.delivered, &data_format)?;
        
        // For storage_state, use formula if not first row, otherwise use value
        if start_row == 19 {
            // First row: initial_storage + produced
            let formula = format!("={}+B{}", data.initial_storage, start_row + 1);
            worksheet.write_with_format(start_row, 3, Formula::new(&formula), &data_format)?;
        } else {
            // Subsequent rows: previous storage + produced
            let formula = format!("=D{}+B{}", start_row, start_row + 1);
            worksheet.write_with_format(start_row, 3, Formula::new(&formula), &data_format)?;
        }
        
        start_row += 1;
    }

    // Укупно row - find the row after data ends
    let total_row = start_row + 10; // Row 39 in Excel (index 38)
    worksheet.write_with_format(total_row, 0, "Укупно", &data_format)?;
    
    // Calculate sum formula for column B (Произведена количина отпада)
    let sum_start = 20; // Row 20 in Excel (index 19, but Excel is 1-indexed)
    let sum_end = start_row; // Last data row
    let sum_formula = format!("=SUM(B{}:B{})", sum_start, sum_end);
    worksheet.write_with_format(total_row, 1, Formula::new(&sum_formula), &data_format)?;

    // Sum formula for column C (Предата количина отпада)
    let sum_formula_c = format!("=SUM(C{}:C{})", sum_start, sum_end);
    worksheet.write_with_format(total_row, 2, Formula::new(&sum_formula_c), &data_format)?;

    // Footer notes
    worksheet.write_with_format(total_row + 2, 0, "1 Евиденција се води за сваку врсту отпада посебно", &data_format)?;
    worksheet.write_with_format(total_row + 3, 0, "2 Означити са X у одговарајућем пољу", &data_format)?;

    workbook.save(&output_path)
        .map_err(|e| format!("Failed to save Excel file: {}", e))?;

    Ok(())
}

