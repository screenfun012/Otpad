import { useState } from "react";
import { Rocket } from "lucide-react";
import type { WasteConfig } from "../types";

interface HeaderFormProps {
  config: WasteConfig;
  initialStorage: number;
  onConfigChange: (config: Partial<WasteConfig>) => void;
  onInitialStorageChange: (value: number) => void;
  onGenerate: () => void;
  darkMode?: boolean;
}


export default function HeaderForm({
  config,
  initialStorage,
  onConfigChange,
  onInitialStorageChange,
  onGenerate,
  darkMode = false,
}: HeaderFormProps) {
  const theme = darkMode ? {
    bg: "#161b22",
    text: "#c9d1d9",
    border: "#30363d",
    inputBg: "#21262d",
    button: "#dc2626",
  } : {
    bg: "#ffffff",
    text: "#1f2328",
    border: "#d1d9e0",
    inputBg: "#ffffff",
    button: "#dc2626",
  };

  const [localConfig, setLocalConfig] = useState(config);
  const [localStorage, setLocalStorage] = useState(initialStorage.toString());

  const handleChange = (field: keyof WasteConfig, value: string | number) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange({ [field]: value });
  };

  const handleStorageChange = (value: string) => {
    if (value === "") {
      setLocalStorage("");
      onInitialStorageChange(0);
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      // Validate: must be 0 or start from 0.0001, 0.0010, 0.0100, 0.1000, 1.0000, etc.
      if (numValue === 0) {
        setLocalStorage(value);
        onInitialStorageChange(0);
      } else if (numValue >= 0.0001) {
        // Round to 4 decimal places
        const rounded = Math.round(numValue * 10000) / 10000;
        setLocalStorage(rounded.toFixed(4));
        onInitialStorageChange(rounded);
      }
      // Otherwise ignore invalid input
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: `1px solid ${theme.border}`,
        boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: theme.text, fontSize: "20px", fontWeight: "600" }}>
        Подаци о отпаду
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Година
          </label>
          <input
            type="number"
            value={localConfig.year}
            onChange={(e) => handleChange("year", parseInt(e.target.value) || new Date().getFullYear())}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: theme.inputBg,
              color: theme.text,
              transition: "all 0.2s",
            }}
          />
        </div>


        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Индексни број отпада из Каталога отпада
          </label>
          <input
            type="text"
            value={localConfig.index_number}
            onChange={(e) => handleChange("index_number", e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: theme.inputBg,
              color: theme.text,
              transition: "all 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Назив отпада
          </label>
          <input
            type="text"
            value={localConfig.waste_name}
            onChange={(e) => handleChange("waste_name", e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: theme.inputBg,
              color: theme.text,
              transition: "all 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Опис отпада
          </label>
          <input
            type="text"
            value={localConfig.waste_description}
            onChange={(e) => handleChange("waste_description", e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: theme.inputBg,
              color: theme.text,
              transition: "all 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Евиденцију води (Име и презиме)
          </label>
          <input
            type="text"
            value={localConfig.record_keeper}
            onChange={(e) => handleChange("record_keeper", e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: theme.inputBg,
              color: theme.text,
              transition: "all 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Почетно стање на привременом складишту (т)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={localStorage}
            onChange={(e) => handleStorageChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
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
              const val = parseFloat(e.target.value) || 0;
              if (val > 0 && val < 0.0001) {
                setLocalStorage("0.0000");
                onInitialStorageChange(0);
              } else if (val >= 0.0001) {
                const rounded = Math.round(val * 10000) / 10000;
                setLocalStorage(rounded.toFixed(4));
                onInitialStorageChange(rounded);
              } else if (val === 0) {
                setLocalStorage("0.0000");
                onInitialStorageChange(0);
              }
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
        <button
          onClick={onGenerate}
          style={{
            padding: "14px 32px",
            backgroundColor: theme.button,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)",
            transition: "all 0.2s",
            minWidth: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(220, 38, 38, 0.4)";
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(220, 38, 38, 0.3)";
            e.currentTarget.style.backgroundColor = theme.button;
          }}
        >
          <Rocket size={18} style={{ marginRight: "8px", display: "inline" }} />
          Генериши податке
        </button>
      </div>
    </div>
  );
}

