import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type MutableRefObject,
  type RefObject,
} from "react";
import { invoke } from "../utils/tauriInvoke";
import type { WasteConfig } from "../types";
import { serbianCyrillicToLatin } from "../utils/serbianCyrillicToLatin";

/** Nekontrolisana polja (defaultValue) — izbegava blokadu unosa od React kontrolisanog value + čestih re-rendera roditelja. */
function DraftConfigForm({
  theme,
  defaults,
  draftWasteNameRef,
  draftIndexRef,
  draftDescRef,
  draftKeeperRef,
  syncExportDraftFromInputs,
  onSave,
}: {
  theme: {
    border: string;
    inputBg: string;
    text: string;
    surface: string;
    button: string;
  };
  defaults: WasteConfig;
  draftWasteNameRef: RefObject<HTMLInputElement | null>;
  draftIndexRef: RefObject<HTMLInputElement | null>;
  draftDescRef: RefObject<HTMLInputElement | null>;
  draftKeeperRef: RefObject<HTMLInputElement | null>;
  syncExportDraftFromInputs: () => void;
  onSave: () => void;
}) {
  useLayoutEffect(() => {
    syncExportDraftFromInputs();
  }, [defaults, syncExportDraftFromInputs]);

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: theme.inputBg,
    color: theme.text,
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: theme.surface,
        borderRadius: "8px",
        marginBottom: "15px",
        border: `1px solid ${theme.border}`,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
              Naziv otpada
            </label>
            <input
              ref={draftWasteNameRef}
              type="text"
              name="waste_name"
              autoComplete="off"
              spellCheck={false}
              defaultValue={defaults.waste_name}
              onInput={syncExportDraftFromInputs}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
              Indeksni broj
            </label>
            <input
              ref={draftIndexRef}
              type="text"
              name="index_number"
              autoComplete="off"
              spellCheck={false}
              defaultValue={defaults.index_number}
              onInput={syncExportDraftFromInputs}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
              Opis otpada
            </label>
            <input
              ref={draftDescRef}
              type="text"
              name="waste_description"
              autoComplete="off"
              spellCheck={false}
              defaultValue={defaults.waste_description}
              onInput={syncExportDraftFromInputs}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: theme.text, fontWeight: "500" }}>
              Evidenciju vodi
            </label>
            <input
              ref={draftKeeperRef}
              type="text"
              name="record_keeper"
              autoComplete="off"
              spellCheck={false}
              defaultValue={defaults.record_keeper}
              onInput={syncExportDraftFromInputs}
              style={inputStyle}
            />
          </div>
        </div>
        <button
          type="submit"
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
          }}
        >
          Sačuvaj konfiguraciju
        </button>
      </form>
    </div>
  );
}

interface ConfigManagerProps {
  currentConfig: WasteConfig;
  /** ID sačuvanog šablona (config_*) — za <select>; ne mešati sa id meseca YYYY_MM u stanju. */
  selectedTemplateId: string | null;
  /** Ref u App za nacrt zaglavlja pri izvozu — ažurira se u onChange bez useEffect-a. */
  exportHeaderDraftRef: MutableRefObject<WasteConfig | null>;
  onConfigSelect: (config: WasteConfig) => void;
  /** Posle brisanja fajla šablona (da App očisti izbor ako treba). */
  onConfigDeleted?: (deletedId: string) => void;
  darkMode?: boolean;
}

export default function ConfigManager({
  currentConfig,
  selectedTemplateId,
  exportHeaderDraftRef,
  onConfigSelect,
  onConfigDeleted,
  darkMode = false,
}: ConfigManagerProps) {
  const theme = darkMode ? {
    bg: "#161b22",
    text: "#c9d1d9",
    border: "#30363d",
    inputBg: "#21262d",
    button: "#dc2626",
    buttonSecondary: "#30363d",
    surface: "#21262d",
    chevron: "%23c9d1d9",
  } : {
    bg: "#ffffff",
    text: "#1f2328",
    border: "#d1d9e0",
    inputBg: "#ffffff",
    button: "#dc2626",
    buttonSecondary: "#e1e4e8",
    surface: "#f8f9fa",
    chevron: "%231f2328",
  };

  const selectStyle: CSSProperties = {
    width: "100%",
    padding: "12px 42px 12px 14px",
    borderRadius: "10px",
    border: `1px solid ${theme.border}`,
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: theme.inputBg,
    color: theme.text,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${theme.chevron}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    outline: "none",
    colorScheme: darkMode ? "dark" : "light",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const [configs, setConfigs] = useState<WasteConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  /** Svako otvaranje forme dobija novi key — nekontrolisana polja se čisto remount-uju. */
  const [draftFormKey, setDraftFormKey] = useState(0);
  /** Osnova za default vrednosti u DOM-u (React prati ovo u uslovu rendera). */
  const [draftSnapshot, setDraftSnapshot] = useState<WasteConfig | null>(null);
  /** Osnova za čuvanje (godina, mesec, opciona polja) kad se otvori „Dodaj novu“. */
  const draftBaseRef = useRef<WasteConfig | null>(null);
  const draftWasteNameRef = useRef<HTMLInputElement>(null);
  const draftIndexRef = useRef<HTMLInputElement>(null);
  const draftDescRef = useRef<HTMLInputElement>(null);
  const draftKeeperRef = useRef<HTMLInputElement>(null);

  const syncExportDraftFromInputs = useCallback(() => {
    const base = draftBaseRef.current;
    if (!base) return;
    exportHeaderDraftRef.current = {
      ...base,
      waste_name: draftWasteNameRef.current?.value ?? "",
      index_number: draftIndexRef.current?.value ?? "",
      waste_description: draftDescRef.current?.value ?? "",
      record_keeper: draftKeeperRef.current?.value ?? "",
    };
  }, [exportHeaderDraftRef]);

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
    const base = draftBaseRef.current;
    if (!base) return;
    syncExportDraftFromInputs();
    try {
      const toSave: WasteConfig = {
        ...base,
        waste_name: draftWasteNameRef.current?.value ?? "",
        index_number: draftIndexRef.current?.value ?? "",
        waste_description: draftDescRef.current?.value ?? "",
        record_keeper: draftKeeperRef.current?.value ?? "",
        id: base.id || `config_${Date.now()}`,
      };
      await invoke("save_config", { config: toSave });
      await loadConfigs();
      setShowForm(false);
      draftBaseRef.current = null;
      exportHeaderDraftRef.current = null;
      onConfigSelect({
        ...toSave,
        year: currentConfig.year,
        month: currentConfig.month,
        id: toSave.id,
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("Greška pri čuvanju konfiguracije!");
    }
  };

  const handleDeleteSelectedConfig = async () => {
    if (!selectedTemplateId) {
      alert("Prvo izaberite konfiguraciju u listi.");
      return;
    }
    if (
      !confirm(
        "Obrisati ovu konfiguraciju sa diska? Ovo ne briše podatke meseci (evidencija po mesecima ostaje).",
      )
    ) {
      return;
    }
    try {
      await invoke("delete_config", { configId: selectedTemplateId });
      await loadConfigs();
      onConfigDeleted?.(selectedTemplateId);
    } catch (error) {
      console.error("delete_config:", error);
      alert(`Greška pri brisanju: ${error}`);
    }
  };

  const handleTransliterateSelected = async () => {
    if (!selectedTemplateId) {
      alert("Prvo izaberite konfiguraciju u listi.");
      return;
    }
    const cfg = configs.find((c) => c.id === selectedTemplateId);
    if (!cfg) return;
    const updated: WasteConfig = {
      ...cfg,
      index_number: serbianCyrillicToLatin(cfg.index_number),
      waste_name: serbianCyrillicToLatin(cfg.waste_name),
      waste_description: serbianCyrillicToLatin(cfg.waste_description),
      record_keeper: serbianCyrillicToLatin(cfg.record_keeper),
    };
    try {
      await invoke("save_config", { config: updated });
      await loadConfigs();
      onConfigSelect({
        ...updated,
        year: currentConfig.year,
        month: currentConfig.month,
        id: updated.id,
      });
    } catch (error) {
      console.error("save_config (latinica):", error);
      alert(`Greška pri čuvanju: ${error}`);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: "20px 24px",
        borderRadius: "12px",
        marginBottom: "24px",
        marginLeft: "auto",
        marginRight: "auto",
        maxWidth: "960px",
        border: `1px solid ${theme.border}`,
        boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ color: theme.text, fontSize: "18px", fontWeight: "600", margin: 0 }}>Konfiguracije otpada</h3>
        <button
          type="button"
          onClick={() => {
            if (!showForm) {
              const initial: WasteConfig = { ...currentConfig, id: "" };
              draftBaseRef.current = initial;
              setDraftSnapshot(initial);
              setDraftFormKey((k) => k + 1);
              setShowForm(true);
            } else {
              setDraftSnapshot(null);
              draftBaseRef.current = null;
              exportHeaderDraftRef.current = null;
              setShowForm(false);
            }
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.buttonSecondary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: "10px",
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
          {showForm ? "Otkaži" : "Dodaj novu"}
        </button>
      </div>

      {showForm && draftSnapshot && (
        <DraftConfigForm
          key={draftFormKey}
          theme={theme}
          defaults={draftSnapshot}
          draftWasteNameRef={draftWasteNameRef}
          draftIndexRef={draftIndexRef}
          draftDescRef={draftDescRef}
          draftKeeperRef={draftKeeperRef}
          syncExportDraftFromInputs={syncExportDraftFromInputs}
          onSave={handleSaveConfig}
        />
      )}

      {configs.length > 0 && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: theme.text, fontWeight: "600" }}>
            Izaberi konfiguraciju
          </label>
          <select
            value={selectedTemplateId ?? ""}
            onChange={(e) => {
              const selected = configs.find((c) => c.id === e.target.value);
              if (selected) {
                onConfigSelect(selected);
              }
            }}
            style={selectStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(220, 38, 38, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">-- Izaberi konfiguraciju --</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.waste_name} ({config.index_number})
              </option>
            ))}
          </select>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              disabled={!selectedTemplateId}
              onClick={handleTransliterateSelected}
              style={{
                padding: "10px 16px",
                backgroundColor: selectedTemplateId ? theme.buttonSecondary : theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                cursor: selectedTemplateId ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: 500,
                opacity: selectedTemplateId ? 1 : 0.55,
              }}
            >
              Prebaci izabrano na latinicu
            </button>
            <button
              type="button"
              disabled={!selectedTemplateId}
              onClick={handleDeleteSelectedConfig}
              style={{
                padding: "10px 16px",
                backgroundColor: selectedTemplateId ? "#7f1d1d" : theme.surface,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: selectedTemplateId ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: 600,
                opacity: selectedTemplateId ? 1 : 0.55,
              }}
            >
              Obriši izabranu konfiguraciju
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

