export interface WasteConfig {
  id: string;
  year: number;
  month: number;
  index_number: string;
  waste_name: string;
  waste_description: string;
  record_keeper: string;
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

