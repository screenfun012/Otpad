import type { MonthData, WasteConfig } from "../types";

/**
 * Excel zaglavlje (indeks, naziv otpada, opis, evidenciju vodi) uzima iz aktivnog
 * UI-a (glavna forma ili otvorena „Dodaj novu“), ne iz starog JSON-a meseca.
 * Godina i mesec u tabeli ostaju oni iz učitanog meseca.
 */
export function monthDataForExport(monthData: MonthData, ui: WasteConfig): MonthData {
  return {
    ...monthData,
    config: {
      ...monthData.config,
      index_number: ui.index_number,
      waste_name: ui.waste_name,
      waste_description: ui.waste_description,
      record_keeper: ui.record_keeper,
    },
  };
}
