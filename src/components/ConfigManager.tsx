import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { WasteConfig } from "../types";

interface ConfigManagerProps {
  currentConfig: WasteConfig;
  onConfigSelect: (config: WasteConfig) => void;
  darkMode?: boolean;
}

export default function ConfigManager({
  currentConfig,
  onConfigSelect,
  darkMode = false,
}: ConfigManagerProps) {
  const theme = darkMode ? {
    bg: "#161b22",
    text: "#c9d1d9",
    border: "#30363d",
    inputBg: "#21262d",
    button: "#dc2626",
    buttonSecondary: "#6b6b6b",
    surface: "#21262d",
  } : {
    bg: "#ffffff",
    text: "#1f2328",
    border: "#d1d9e0",
    inputBg: "#ffffff",
    button: "#dc2626",
    buttonSecondary: "#6c757d",
    surface: "#f8f9fa",
  };
  const [configs, setConfigs] = useState<WasteConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newConfig, setNewConfig] = useState<WasteConfig>({
    id: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    index_number: "170402",
    waste_name: "Отпадни алуминијум",
    waste_description: "неопасан отпад",
    record_keeper: "Наташа Јевтић",
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const loaded = await invoke<WasteConfig[]>("load_configs");
      setConfigs(loaded);
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      if (!newConfig.id) {
        newConfig.id = `config_${Date.now()}`;
      }
      await invoke("save_config", { config: newConfig });
      await loadConfigs();
      setShowForm(false);
      setNewConfig({
        id: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        index_number: "170402",
        waste_name: "Отпадни алуминијум",
        waste_description: "неопасан отпад",
        record_keeper: "Наташа Јевтић",
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("Greška pri čuvanju konfiguracije!");
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: `1px solid ${theme.border}`,
        boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ color: theme.text, fontSize: "18px", fontWeight: "600", margin: 0 }}>Конфигурације отпада</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.buttonSecondary,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {showForm ? "Откажи" : "Додај нову"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: "20px",
            backgroundColor: theme.surface,
            borderRadius: "8px",
            marginBottom: "15px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
                Назив отпада
              </label>
              <input
                type="text"
                value={newConfig.waste_name}
                onChange={(e) => setNewConfig({ ...newConfig, waste_name: e.target.value })}
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
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
                Индексни број
              </label>
              <input
                type="text"
                value={newConfig.index_number}
                onChange={(e) => setNewConfig({ ...newConfig, index_number: e.target.value })}
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
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
                Опис отпада
              </label>
              <input
                type="text"
                value={newConfig.waste_description}
                onChange={(e) => setNewConfig({ ...newConfig, waste_description: e.target.value })}
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
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
                Евиденцију води
              </label>
              <input
                type="text"
                value={newConfig.record_keeper}
                onChange={(e) => setNewConfig({ ...newConfig, record_keeper: e.target.value })}
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
          </div>
          <button
            onClick={handleSaveConfig}
            style={{
              padding: "12px 24px",
              backgroundColor: theme.button,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(220, 38, 38, 0.3)";
              e.currentTarget.style.backgroundColor = "#b91c1c";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(220, 38, 38, 0.2)";
              e.currentTarget.style.backgroundColor = theme.button;
            }}
          >
            Сачувај конфигурацију
          </button>
        </div>
      )}

      {configs.length > 0 && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: theme.text, fontWeight: "500" }}>
            Изабери конфигурацију:
          </label>
          <select
            value={currentConfig.id || ""}
            onChange={(e) => {
              const selected = configs.find((c) => c.id === e.target.value);
              if (selected) {
                onConfigSelect(selected);
              }
            }}
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
          >
            <option value="">-- Изабери конфигурацију --</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.waste_name} ({config.index_number})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

