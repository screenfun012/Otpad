import { BarChart3 } from "lucide-react";
import type { DayData } from "../types";
import {
  formatTonsDisplay,
  formatTonsTableCell,
  nonNegativeTons,
  parseTonsInput,
} from "../utils/parseTonsInput";

interface WasteTableProps {
  days: DayData[];
  totalProduced: number;
  onDayChange: (index: number, field: keyof DayData, value: number | string) => void;
  darkMode?: boolean;
}

export default function WasteTable({
  days,
  totalProduced,
  onDayChange,
  darkMode = false,
}: WasteTableProps) {
  const theme = darkMode ? {
    bg: "#161b22",
    surface: "#21262d",
    text: "#c9d1d9",
    border: "#30363d",
    headerBg: "#21262d",
    inputBg: "#0d1117",
    rowBg: "#161b22",
    rowAltBg: "#1c2128",
  } : {
    bg: "#ffffff",
    surface: "#f8f9fa",
    text: "#1f2328",
    border: "#d1d9e0",
    headerBg: "#f8f9fa",
    inputBg: "#ffffff",
    rowBg: "#ffffff",
    rowAltBg: "#f8f9fa",
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: "24px",
        borderRadius: "12px",
        border: `1px solid ${theme.border}`,
        overflowX: "auto",
        boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: theme.headerBg }}>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: `1px solid ${theme.border}`,
                fontWeight: "600",
                color: theme.text,
                fontSize: "14px",
              }}
            >
              Datum
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: `1px solid ${theme.border}`,
                fontWeight: "600",
                color: theme.text,
                fontSize: "14px",
              }}
            >
              Proizvedena količina otpada (t)
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: `1px solid ${theme.border}`,
                fontWeight: "600",
                color: theme.text,
                fontSize: "14px",
              }}
            >
              Predata količina otpada (t)
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: `1px solid ${theme.border}`,
                fontWeight: "600",
                color: theme.text,
                fontSize: "14px",
              }}
            >
              Stanje na privremenom skladištu (t)
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, index) => (
            <tr key={index}>
              <td
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                }}
              >
                {day.date}
              </td>
              <td
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={formatTonsTableCell(day.produced)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue.trim() === "") {
                      onDayChange(index, "produced", 0);
                      return;
                    }
                    const val = parseTonsInput(inputValue);
                    if (val !== null) {
                      onDayChange(index, "produced", nonNegativeTons(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#dc2626";
                    e.target.style.boxShadow = "0 0 0 2px rgba(220, 38, 38, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </td>
              <td
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={formatTonsTableCell(day.delivered)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.trim() === "") {
                      onDayChange(index, "delivered", 0);
                      return;
                    }
                    const val = parseTonsInput(v);
                    if (val !== null) {
                      onDayChange(index, "delivered", nonNegativeTons(val));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#dc2626";
                    e.target.style.boxShadow = "0 0 0 2px rgba(220, 38, 38, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </td>
              <td
                style={{
                  padding: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
              >
                {formatTonsDisplay(day.storage_state)}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: darkMode ? "#21262d" : "#f0f0f0", fontWeight: "bold" }}>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              <BarChart3 size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Ukupno
            </td>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              {formatTonsDisplay(totalProduced)}
            </td>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              {formatTonsDisplay(days.reduce((sum, day) => sum + day.delivered, 0))}
            </td>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
              }}
            ></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

