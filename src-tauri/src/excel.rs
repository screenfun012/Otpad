use crate::commands::MonthData;
use rust_xlsxwriter::*;
use std::path::PathBuf;

pub fn export_to_excel(data: &MonthData, output_path: PathBuf) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Set column widths to match the example file (A4 format)
    worksheet.set_column_width(0, 6.14).map_err(|e| e.to_string())?;  // A: Datum
    worksheet.set_column_width(1, 11.29).map_err(|e| e.to_string())?; // B: Произведена
    worksheet.set_column_width(2, 9.71).map_err(|e| e.to_string())?;  // C: Предата
    worksheet.set_column_width(3, 12.14).map_err(|e| e.to_string())?;  // D: Стање
    worksheet.set_column_width(4, 4.14).map_err(|e| e.to_string())?;  // E: Сакупљачу
    worksheet.set_column_width(5, 8.14).map_err(|e| e.to_string())?;  // F: Оператеру на поновно
    worksheet.set_column_width(6, 4.14).map_err(|e| e.to_string())?;   // G: R ознака
    worksheet.set_column_width(7, 7.57).map_err(|e| e.to_string())?; // H: Оператеру на одлагање
    worksheet.set_column_width(8, 4.14).map_err(|e| e.to_string())?; // I: D ознака
    worksheet.set_column_width(9, 13.0).map_err(|e| e.to_string())?;  // J: Извоз
    worksheet.set_column_width(10, 14.43).map_err(|e| e.to_string())?; // K: Назив предузећа
    worksheet.set_column_width(11, 8.0).map_err(|e| e.to_string())?;   // L: Број дозволе

    write_month_to_sheet(worksheet, data, 0)?;

    println!("Saving Excel file to: {:?}", output_path);
    workbook.save(&output_path)
        .map_err(|e| format!("Failed to save Excel file: {}", e))?;
    
    println!("Excel file saved successfully");

    Ok(())
}

pub fn export_year_to_excel(months: &[MonthData], output_path: PathBuf) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Set column widths to match the example file (A4 format)
    worksheet.set_column_width(0, 6.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(1, 11.29).map_err(|e| e.to_string())?;
    worksheet.set_column_width(2, 9.71).map_err(|e| e.to_string())?;
    worksheet.set_column_width(3, 12.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(4, 4.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(5, 8.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(6, 4.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(7, 7.57).map_err(|e| e.to_string())?;
    worksheet.set_column_width(8, 4.14).map_err(|e| e.to_string())?;
    worksheet.set_column_width(9, 13.0).map_err(|e| e.to_string())?;
    worksheet.set_column_width(10, 14.43).map_err(|e| e.to_string())?;
    worksheet.set_column_width(11, 8.0).map_err(|e| e.to_string())?;

    let mut current_row = 0;
    for month in months {
        current_row = write_month_to_sheet(worksheet, &month, current_row)?;
        // Add spacing between months (2 empty rows)
        current_row += 2;
    }

    println!("Saving year Excel file to: {:?}", output_path);
    workbook.save(&output_path)
        .map_err(|e| format!("Failed to save Excel file: {}", e))?;
    
    println!("Excel file saved successfully");

    Ok(())
}

fn write_month_to_sheet<'a>(worksheet: &'a mut Worksheet, data: &MonthData, start_row: u32) -> Result<u32, String> {
    // Header styles with thick borders
    let header_format = Format::new()
        .set_background_color("#D9D9D9") // Gray background
        .set_font_name("Calibri")
        .set_font_size(10)
        .set_bold()
        .set_border(FormatBorder::Medium)
        .set_text_wrap();

    let title_format = Format::new()
        .set_background_color("#D9D9D9")
        .set_font_name("Calibri")
        .set_font_size(11)
        .set_bold()
        .set_border(FormatBorder::Medium)
        .set_text_wrap()
        .set_align(FormatAlign::Left);

    let data_format = Format::new()
        .set_font_name("Calibri")
        .set_font_size(11)
        .set_border(FormatBorder::Thin)
        .set_text_wrap();

    // Helper macro to write cells with error handling
    macro_rules! write_cell {
        ($row:expr, $col:expr, $value:expr, $format:expr) => {
            worksheet.write_with_format($row, $col, $value, $format).map_err(|e| e.to_string())?
        };
    }

    let mut row = start_row;

    // Row 1: ПРИЛОГ 1. - merge K1:L1 across 2 rows
    worksheet.merge_range(row, 10, row + 1, 11, "ПРИЛОГ 1.", &data_format).map_err(|e| e.to_string())?;
    
    // Row 2: ОБРАЗАЦ ДЕО 1 - merge K2:L2 (same merge range as row 1, but different text)
    // We'll write it in the second row of the merged range
    write_cell!(row + 1, 10, "ОБРАЗАЦ ДЕО 1", &data_format);
    row += 2;

    // Row 3: ДНЕВНА ЕВИДЕНЦИЈА О ОТПАДУ ПРОИЗВОЂАЧА ОТПАДА 1 - merge B3:I3 across 2 rows
    worksheet.merge_range(row, 1, row + 1, 8, "ДНЕВНА ЕВИДЕНЦИЈА О ОТПАДУ ПРОИЗВОЂАЧА ОТПАДА 1", &data_format).map_err(|e| e.to_string())?;
    row += 2;

    // Empty row
    row += 1;

    // Value format - white background with bold border, centered text
    let value_format = Format::new()
        .set_background_color("#FFFFFF")
        .set_font_name("Calibri")
        .set_font_size(11)
        .set_border(FormatBorder::Medium)
        .set_text_wrap()
        .set_align(FormatAlign::Center);

    // Update title format to have bold border and centered text
    let title_format_bold = Format::new()
        .set_background_color("#D9D9D9")
        .set_font_name("Calibri")
        .set_font_size(11)
        .set_bold()
        .set_border(FormatBorder::Medium)
        .set_text_wrap()
        .set_align(FormatAlign::Center);

    // Row 5: Година - 5 cells for label (B5:F5 gray), 5 cells for value (G5:K5 white)
    worksheet.merge_range(row, 1, row, 5, "Година", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.year.to_string(), &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 7: Месец - 5 cells for label, 5 cells for value
    let month_names = [
        "", "Јануар", "Фебруар", "Март", "Април", "Мај", "Јун",
        "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"
    ];
    let month_name = if data.config.month <= 12 {
        month_names[data.config.month as usize]
    } else {
        ""
    };
    worksheet.merge_range(row, 1, row, 5, "Месец", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, month_name, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 9: Индексни број отпада из Каталога отпада - 5 cells for label, 5 cells for value
    worksheet.merge_range(row, 1, row, 5, "Индексни број отпада из Каталога отпада", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.index_number, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 11: Назив отпада - 5 cells for label, 5 cells for value
    worksheet.merge_range(row, 1, row, 5, "Назив отпада", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.waste_name, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 13: Опис отпада - 5 cells for label, 5 cells for value
    worksheet.merge_range(row, 1, row, 5, "Опис отпада", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.waste_description, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 15: Евиденцију води (Име и презиме) - 5 cells for label, 5 cells for value
    worksheet.merge_range(row, 1, row, 5, "Евиденцију води (Име и презиме)", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.record_keeper, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty rows
    row += 2;

    // Row 18: Headers - merge cells for headers (A18:D18 and E18:L18)
    worksheet.merge_range(row, 0, row, 3, "ПРОИЗВЕДЕНЕ КОЛИЧИНЕ ОТАДА", &header_format).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 4, row, 11, "ОТПАД ПРЕДАТ", &header_format).map_err(|e| e.to_string())?;
    row += 1;

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
        if col < 12 {
            write_cell!(row, col as u16, *header, &header_format);
        }
    }
    row += 1;

    // Data rows
    let data_start_row = row;
    let mut start_row = row;
    
    for day in &data.days {
        write_cell!(start_row, 0, &day.date, &data_format);
        // Format produced value to 4 decimal places (0.0001, 0.0002, etc.)
        let produced_formatted = (day.produced * 10000.0).round() / 10000.0;
        write_cell!(start_row, 1, produced_formatted, &data_format);
        write_cell!(start_row, 2, day.delivered, &data_format);
        
        // Use formula for storage state
        if start_row == data_start_row {
            // First row: initial_storage + produced
            let formula = format!("={}+B{}", data.initial_storage, start_row + 1);
            write_cell!(start_row, 3, Formula::new(&formula), &data_format);
        } else {
            // Subsequent rows: previous storage + produced
            let formula = format!("=D{}+B{}", start_row, start_row + 1);
            write_cell!(start_row, 3, Formula::new(&formula), &data_format);
        }
        
        // Write empty cells for remaining columns (4-11) with borders
        for col in 4..=11 {
            write_cell!(start_row, col, "", &data_format);
        }
        
        start_row += 1;
    }

    // Укупно row
    let data_end_row = start_row;
    let rows_to_add = if data_end_row < data_start_row + 19 { 
        (data_start_row + 19) - data_end_row 
    } else { 
        1 
    };
    let total_row = data_end_row + rows_to_add;
    
    write_cell!(total_row, 0, "Укупно", &data_format);
    
    // Calculate sum formula for column B (Произведена количина отпада)
    let sum_start_excel = data_start_row + 1; // Excel is 1-indexed
    let sum_end_excel = data_end_row;
    let sum_formula = format!("=SUM(B{}:B{})", sum_start_excel, sum_end_excel);
    write_cell!(total_row, 1, Formula::new(&sum_formula), &data_format);

    // Sum formula for column C (Предата количина отпада)
    let sum_formula_c = format!("=SUM(C{}:C{})", sum_start_excel, sum_end_excel);
    write_cell!(total_row, 2, Formula::new(&sum_formula_c), &data_format);

    // Footer notes - merge across multiple columns
    worksheet.merge_range(total_row + 2, 0, total_row + 2, 11, "1 Евиденција се води за сваку врсту отпада посебно", &data_format).map_err(|e| e.to_string())?;
    worksheet.merge_range(total_row + 3, 0, total_row + 3, 11, "2 Означити са X у одговарајућем пољу", &data_format).map_err(|e| e.to_string())?;

    Ok(total_row + 4)
}
