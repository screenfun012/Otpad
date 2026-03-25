import { useState, useEffect, type CSSProperties } from "react";
import { Rocket, Shuffle, Save } from "lucide-react";
import type { WasteConfig } from "../types";
import { formatTonsForInput, nonNegativeTons, parseTonsInput } from "../utils/parseTonsInput";

const MONTH_NAMES = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

interface HeaderFormProps {
  config: WasteConfig;
  yearStartStorage: number;
  decemberClosingStorage: number;
  yearlyProductionTotal: number;
  onConfigChange: (config: Partial<WasteConfig>) => void;
  onYearStartChange: (value: number) => void;
  onDecemberClosingChange: (value: number) => void;
  onYearlyProductionChange: (value: number) => void;
  onGenerateYearDistributed: () => void;
  onGenerateYearRandom: () => void;
  onGenerateMonthRandom: () => void;
  onSaveMonth: () => void;
  darkMode?: boolean;
}


export default function HeaderForm({
  config,
  yearStartStorage,
  decemberClosingStorage,
  yearlyProductionTotal,
  onConfigChange,
  onYearStartChange,
  onDecemberClosingChange,
  onYearlyProductionChange,
  onGenerateYearDistributed,
  onGenerateYearRandom,
  onGenerateMonthRandom,
  onSaveMonth,
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
  const [localStart, setLocalStart] = useState(() => formatTonsForInput(yearStartStorage));
  const [localDec, setLocalDec] = useState(() => formatTonsForInput(decemberClosingStorage));
  const [localProd, setLocalProd] = useState(() => formatTonsForInput(yearlyProductionTotal));

  useEffect(() => {
    setLocalConfig(config);
  }, [config.id, config.year, config.month, config.index_number, config.waste_name, config.waste_description, config.record_keeper]);

  useEffect(() => {
    setLocalStart(formatTonsForInput(yearStartStorage));
  }, [yearStartStorage]);

  useEffect(() => {
    setLocalDec(formatTonsForInput(decemberClosingStorage));
  }, [decemberClosingStorage]);

  useEffect(() => {
    setLocalProd(formatTonsForInput(yearlyProductionTotal));
  }, [yearlyProductionTotal]);

  const handleChange = (field: keyof WasteConfig, value: string | number) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange({ [field]: value });
  };

  /** Samo lokalni tekst dok kucate; broj na roditelja ide na blur (bez zaokruživanja pri svakom karakteru). */
  const blurTons = (
    raw: string,
    localSet: (s: string) => void,
    setter: (n: number) => void,
  ) => {
    const n = parseTonsInput(raw);
    if (n !== null) {
      const r = nonNegativeTons(n);
      localSet(formatTonsForInput(r));
      setter(r);
    } else {
      localSet("");
      setter(0);
    }
  };

  const sectionStyle: CSSProperties = {
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    padding: "16px 18px",
    marginBottom: "18px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: theme.inputBg,
    color: theme.text,
  };

  const hintStyle: CSSProperties = {
    margin: "8px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: theme.text,
    opacity: 0.88,
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        padding: "24px",
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
      <h2 style={{ marginBottom: "6px", color: theme.text, fontSize: "20px", fontWeight: "600", textAlign: "center" }}>
        Unos podataka
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: "13px", color: theme.text, opacity: 0.9, textAlign: "center", lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>Raspodela</strong> i <strong style={{ fontWeight: 600 }}>nasumično (cela godina)</strong> koriste <strong style={{ fontWeight: 600 }}>početak</strong> i, ako ga unesete, <strong style={{ fontWeight: 600 }}>kraj decembra</strong> — nasumične dnevne količine se onda usklađavaju sa tim krajem. Brojevi se prikazuju sa do <strong style={{ fontWeight: 600 }}>3 decimale</strong>. Unos u polja se zaokružuje tek kad polje izgubi fokus (napustite ga tabom ili klikom).
      </p>

      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 12px", color: theme.text, fontSize: "15px", fontWeight: 600 }}>
          Godina evidencije
        </h3>
        <div style={{ maxWidth: "200px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: theme.text,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Godina
          </label>
          <input
            type="number"
            value={localConfig.year}
            onChange={(e) => handleChange("year", parseInt(e.target.value, 10) || new Date().getFullYear())}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 8px", color: theme.text, fontSize: "15px", fontWeight: 600 }}>
          Stanje na privremenom skladištu (t)
        </h3>
        <p style={{ ...hintStyle, marginTop: 0, marginBottom: "14px" }}>
          <strong style={{ fontWeight: 600 }}>Početak</strong> je stanje 1. januara za <strong style={{ fontWeight: 600 }}>ovu</strong> godinu evidencije (nastavak od prethodne godine, ako unesete prenos). <strong style={{ fontWeight: 600 }}>Kraj decembra</strong> je stanje na poslednji dan <strong style={{ fontWeight: 600 }}>iste</strong> godine. Koristi se za „raspodelu“ i za „nasumično (cela godina)“ da se kraj godine poklopi sa unetim.
        </p>
        <p style={{ ...hintStyle, marginTop: "-8px", marginBottom: "14px", fontSize: "12px" }}>
          Sve je u <strong style={{ fontWeight: 600 }}>tonama (t)</strong>. <strong style={{ fontWeight: 600 }}>Ispod pune tone</strong> (npr. <strong style={{ fontWeight: 600 }}>0,99</strong>) i dalje su to tone — samo nema cele tone. <strong style={{ fontWeight: 600 }}>Od 1 t</strong> može <strong style={{ fontWeight: 600 }}>1.640</strong> = 1 t + 640 kg (isto što i <strong style={{ fontWeight: 600 }}>1,64</strong> t). Za velike količine: <strong style={{ fontWeight: 600 }}>1640</strong> t. <strong style={{ fontWeight: 600 }}>Ispod nule nije dozvoljeno</strong>.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
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
              Početak godine (1. januar)
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              onBlur={(e) => blurTons(e.target.value, setLocalStart, onYearStartChange)}
              placeholder="npr. 0,5 ili 1.640 (1 t + 640 kg)"
              style={inputStyle}
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
              Kraj decembra (poslednji dan u godini)
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={localDec}
              onChange={(e) => setLocalDec(e.target.value)}
              onBlur={(e) => blurTons(e.target.value, setLocalDec, onDecemberClosingChange)}
              placeholder="npr. 1640 t ili 1.640 (1 t + 640 kg)"
              style={inputStyle}
            />
          </div>
        </div>
        <p style={hintStyle}>
          Za „raspodelu“: kolona „Stanje“ se usklađava sa ovim vrednostima — „Proizvedena“ se skalira da početak i kraj godine odgovaraju unetom (računa se unapred i unazad).
        </p>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 8px", color: theme.text, fontSize: "15px", fontWeight: 600 }}>
          Ukupna proizvodnja za godinu (samo „raspodela“)
        </h3>
        <p style={{ ...hintStyle, marginTop: 0, marginBottom: "10px" }}>
          Ako ostavite prazno, koristi se razlika „kraj decembra − početak godine“. Nasumično generisanje ovo polje ne koristi.
        </p>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            color: theme.text,
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Ukupno (t)
        </label>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={localProd}
          onChange={(e) => setLocalProd(e.target.value)}
          onBlur={(e) => blurTons(e.target.value, setLocalProd, onYearlyProductionChange)}
          placeholder="(auto) npr. 12.345 (12 t + 345 kg) ili 1,5"
          style={inputStyle}
        />
      </div>

      <h3 style={{ margin: "0 0 14px", color: theme.text, fontSize: "15px", fontWeight: 600 }}>
        Podaci o otpadu
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginBottom: "24px",
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
            Indeksni broj otpada iz Kataloga otpada
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
            Naziv otpada
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
            Opis otpada
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
            Evidenciju vodi (ime i prezime)
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
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginBottom: "14px",
          padding: "12px 14px",
          borderRadius: "8px",
          border: `1px dashed ${theme.border}`,
          fontSize: "12px",
          lineHeight: 1.55,
          color: theme.text,
          opacity: 0.92,
        }}
      >
        <div style={{ marginBottom: "6px" }}>
          <strong style={{ fontWeight: 600 }}>Raspodela</strong> — koristi polja za stanje i ukupnu proizvodnju iznad; generiše celu godinu u skladu sa tim.
        </div>
        <div style={{ marginBottom: "6px" }}>
          <strong style={{ fontWeight: 600 }}>Nasumično cela godina</strong> — nasumične vrednosti po danima, pa usklađavanje sa početkom i (ako je unet) krajem decembra. <strong style={{ fontWeight: 600 }}>Nasumično jedan mesec</strong> — bez polja za celu godinu; januar od 0, inače nastavak od prethodnog meseca.
        </div>
        <div>
          <strong style={{ fontWeight: 600 }}>Ručno u tabeli</strong> — menjate količine u mesecu; kolona „Stanje“ se preračunava od početnog stanja tog meseca.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px",
          marginTop: "8px",
        }}
      >
        <button
          type="button"
          onClick={onGenerateYearDistributed}
          style={{
            padding: "12px 20px",
            backgroundColor: theme.button,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Rocket size={18} />
          Generiši celu godinu (raspodela)
        </button>
        <button
          type="button"
          onClick={onGenerateYearRandom}
          style={{
            padding: "12px 20px",
            backgroundColor: theme.button,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Rocket size={18} />
          Generiši celu godinu (nasumično)
        </button>
        <button
          type="button"
          onClick={onGenerateMonthRandom}
          style={{
            padding: "12px 20px",
            backgroundColor: theme.button,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Shuffle size={18} />
          Nasumično za {MONTH_NAMES[config.month] ?? ""}
        </button>
        <button
          type="button"
          onClick={onSaveMonth}
          style={{
            padding: "12px 20px",
            backgroundColor: darkMode ? "#238636" : "#1a7f37",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Save size={18} />
          Sačuvaj mesec
        </button>
      </div>
    </div>
  );
}
