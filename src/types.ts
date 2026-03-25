export interface WasteConfig {
  id: string;
  year: number;
  month: number;
  index_number: string;
  waste_name: string;
  waste_description: string;
  record_keeper: string;
  /** Ukupna proizvodnja za godinu (t) pri raspodeli — ako je 0, koristi se razlika kraj decembra − početak godine. */
  yearly_carry_total?: number | null;
  /** Početno stanje na privremenom skladištu (1. januar, pre prvog dnevnog unosa). */
  year_start_storage?: number | null;
  /** Stanje na poslednji dan decembra (kraj godine) — usklađuje kolonu „Stanje“ nakon generisanja. */
  december_closing_storage?: number | null;
}

export interface DayData {
  date: string;
  produced: number;
  delivered: number;
  storage_state: number;
}

export interface MonthData {
  config: WasteConfig;
  days: DayData[];
  initial_storage: number;
}
