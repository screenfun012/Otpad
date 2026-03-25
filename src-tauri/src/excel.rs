use crate::commands::MonthData;
use rust_xlsxwriter::*;
use std::path::PathBuf;

/// Isto kao u Rust `round3` / TS `roundTons` — izbegava 1.640 → 1.641 u Excelu od formule u koloni D.
#[inline]
fn round3(x: f64) -> f64 {
    (x * 1000.0).round() / 1000.0
}

pub fn export_to_excel(data: &MonthData, output_path: PathBuf) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Set column widths to match the example file (A4 format)
    worksheet.set_column_width(0, 6.14).map_err(|e| e.to_string())?;  // A: Datum
    worksheet.set_column_width(1, 11.29).map_err(|e| e.to_string())?; // B: proizvedena
    worksheet.set_column_width(2, 9.71).map_err(|e| e.to_string())?;  // C: predato
    worksheet.set_column_width(3, 12.14).map_err(|e| e.to_string())?;  // D: stanje
    worksheet.set_column_width(4, 4.14).map_err(|e| e.to_string())?;  // E: sakupjaču
    worksheet.set_column_width(5, 8.14).map_err(|e| e.to_string())?;  // F: operatoru
    worksheet.set_column_width(6, 4.14).map_err(|e| e.to_string())?;   // G: R oznaka
    worksheet.set_column_width(7, 7.57).map_err(|e| e.to_string())?; // H: odlaganje
    worksheet.set_column_width(8, 4.14).map_err(|e| e.to_string())?; // I: D oznaka
    worksheet.set_column_width(9, 13.0).map_err(|e| e.to_string())?;  // J: izvoz
    worksheet.set_column_width(10, 14.43).map_err(|e| e.to_string())?; // K: naziv preduzeća
    worksheet.set_column_width(11, 8.0).map_err(|e| e.to_string())?;   // L: broj dozvole

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

    let _title_format = Format::new()
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

    // Row 1–2: Prilog 1. + Obrazac deo 1 (single merge; no extra write into merged cell)
    worksheet
        .merge_range(
            row,
            10,
            row + 1,
            11,
            "Prilog 1.\nObrazac deo 1",
            &data_format,
        )
        .map_err(|e| e.to_string())?;
    row += 2;

    // Row 3: title merge
    worksheet.merge_range(row, 1, row + 1, 8, "DNEVNA EVIDENCIJA O OTPADU PROIZVOĐAČA OTPADA 1", &data_format).map_err(|e| e.to_string())?;
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

    // Row 5: Godina
    worksheet.merge_range(row, 1, row, 5, "Godina", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.year.to_string(), &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 7: Mesec
    let month_names = [
        "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
        "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
    ];
    let month_name = if data.config.month <= 12 {
        month_names[data.config.month as usize]
    } else {
        ""
    };
    worksheet.merge_range(row, 1, row, 5, "Mesec", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, month_name, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 9
    worksheet.merge_range(row, 1, row, 5, "Indeksni broj otpada iz Kataloga otpada", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.index_number, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 11
    worksheet.merge_range(row, 1, row, 5, "Naziv otpada", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.waste_name, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 13
    worksheet.merge_range(row, 1, row, 5, "Opis otpada", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.waste_description, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty row
    row += 1;

    // Row 15
    worksheet.merge_range(row, 1, row, 5, "Evidenciju vodi (ime i prezime)", &title_format_bold).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 6, row, 10, &data.config.record_keeper, &value_format).map_err(|e| e.to_string())?;
    row += 1;

    // Empty rows
    row += 2;

    // Row 18: Headers - merge cells for headers (A18:D18 and E18:L18)
    worksheet.merge_range(row, 0, row, 3, "PROIZVEDENE KOLIČINE OTPADA", &header_format).map_err(|e| e.to_string())?;
    worksheet.merge_range(row, 4, row, 11, "OTPAD PREDAT", &header_format).map_err(|e| e.to_string())?;
    row += 1;

    // Row 19: Column headers
    let headers = [
        "Datum",
        "Proizvedena količina otpada (t)",
        "Predata količina otpada (t)",
        "Stanje na privremenom skladištu (t)",
        "Sakupljaču 2",
        "Operatoru na ponovno iskorišćenje 2",
        "R oznaka",
        "Operatoru na odlaganje 2",
        "D oznaka",
        "Izvoz 2",
        "Naziv preduzeća kojem je otpad predat",
        "Broj dozvole",
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
        // 3 decimale (t); kolona D kao vrednost iz podataka — ne Excel formula (formula daje float drift do 1.641)
        let produced_f = round3(day.produced.max(0.0));
        write_cell!(start_row, 1, produced_f, &data_format);
        write_cell!(start_row, 2, round3(day.delivered.max(0.0)), &data_format);
        write_cell!(start_row, 3, round3(day.storage_state.max(0.0)), &data_format);
        
        // Write empty cells for remaining columns (4-11) with borders
        for col in 4..=11 {
            write_cell!(start_row, col, "", &data_format);
        }
        
        start_row += 1;
    }

    // Total row
    let data_end_row = start_row;
    let rows_to_add = if data_end_row < data_start_row + 19 { 
        (data_start_row + 19) - data_end_row 
    } else { 
        1 
    };
    let total_row = data_end_row + rows_to_add;
    
    write_cell!(total_row, 0, "Ukupno", &data_format);
    
    // Empty month: invalid SUM range without this guard
    let sum_start_excel = data_start_row + 1; // Excel is 1-indexed
    let sum_end_excel = data_end_row;
    if sum_end_excel >= sum_start_excel {
        let sum_formula = format!("=SUM(B{}:B{})", sum_start_excel, sum_end_excel);
        write_cell!(total_row, 1, Formula::new(&sum_formula), &data_format);
        let sum_formula_c = format!("=SUM(C{}:C{})", sum_start_excel, sum_end_excel);
        write_cell!(total_row, 2, Formula::new(&sum_formula_c), &data_format);
    } else {
        write_cell!(total_row, 1, 0.0, &data_format);
        write_cell!(total_row, 2, 0.0, &data_format);
    }

    // Footer notes - merge across multiple columns
    worksheet.merge_range(total_row + 2, 0, total_row + 2, 11, "1 Evidencija se vodi za svaku vrstu otpada posebno", &data_format).map_err(|e| e.to_string())?;
    worksheet.merge_range(total_row + 3, 0, total_row + 3, 11, "2 Označiti sa X u odgovarajućem polju", &data_format).map_err(|e| e.to_string())?;

    Ok(total_row + 4)
}
