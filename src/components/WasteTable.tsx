import { BarChart3 } from "lucide-react";
import type { DayData } from "../types";

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
              Датум
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
              Произведена количина отпада (т)
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
              Предата количина отпада (т)
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
              Стање на привременом складишту (т)
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
                  type="number"
                  step="0.0001"
                  min="0"
                  value={day.produced === 0 ? "" : day.produced.toFixed(4)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === "") {
                      onDayChange(index, "produced", 0);
                      return;
                    }
                    const val = parseFloat(inputValue);
                    if (!isNaN(val) && val >= 0) {
                      // Round to 4 decimal places
                      const rounded = Math.round(val * 10000) / 10000;
                      onDayChange(index, "produced", rounded);
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
                  type="number"
                  step="0.0001"
                  value={day.delivered}
                  onChange={(e) =>
                    onDayChange(index, "delivered", parseFloat(e.target.value) || 0)
                  }
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
                {day.storage_state.toFixed(4)}
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
              Укупно
            </td>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              {totalProduced.toFixed(4)}
            </td>
            <td
              style={{
                padding: "12px",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              {days.reduce((sum, day) => sum + day.delivered, 0).toFixed(4)}
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

