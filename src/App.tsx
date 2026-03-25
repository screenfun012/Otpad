import { useState, useEffect } from "react";
import HeaderForm from "./components/HeaderForm";
import MonthTabs from "./components/MonthTabs";
import WasteTable from "./components/WasteTable";
import ConfigManager from "./components/ConfigManager";
import { invoke, save } from "./utils/tauriInvoke";
import { Moon, Sun, Download, FileText, Loader2, AlertTriangle } from "lucide-react";
import type { WasteConfig, DayData, MonthData } from "./types";
import { nonNegativeTons } from "./utils/parseTonsInput";

/** Proizvedeno/predato ≥ 0; stanje u lancu ≥ 0 (t). Lanac u celim mikro-jedinicama (kao u Rust) da nema 1.640 → 1.641 od zaokruživanja. */
function recomputeStorageForDays(days: DayData[], initialStorage: number): DayData[] {
  let curMicro = Math.round(nonNegativeTons(initialStorage) * 1000);
  return days.map((d) => {
    const p = nonNegativeTons(Number(d.produced) || 0);
    const del = nonNegativeTons(Number(d.delivered) || 0);
    curMicro += Math.round(p * 1000);
    const cur = nonNegativeTons(curMicro / 1000);
    return { ...d, produced: p, delivered: del, storage_state: cur };
  });
}

function App() {
  const [config, setConfig] = useState<WasteConfig>({
    id: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    index_number: "170402",
    waste_name: "Otpadni aluminium",
    waste_description: "neopasan otpad",
    record_keeper: "Nataša Jevtić",
    yearly_carry_total: null,
    year_start_storage: null,
    december_closing_storage: null,
  });

  const [days, setDays] = useState<DayData[]>([]);
  const [initialStorage, setInitialStorage] = useState(0.0);
  const [yearStartStorage, setYearStartStorage] = useState(0);
  const [decemberClosingStorage, setDecemberClosingStorage] = useState(0);
  const [yearlyProductionTotal, setYearlyProductionTotal] = useState(0);
  const [totalProduced, setTotalProduced] = useState(0.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  const loadMonthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<MonthData | null>("get_month_data", {
        year: config.year,
        month: config.month,
      });

      if (data) {
        setConfig(data.config);
        const init = nonNegativeTons(data.initial_storage);
        setInitialStorage(init);
        setDays(recomputeStorageForDays(data.days, init));
        setYearStartStorage(nonNegativeTons(data.config.year_start_storage ?? init));
        setDecemberClosingStorage(nonNegativeTons(data.config.december_closing_storage ?? 0));
        setYearlyProductionTotal(nonNegativeTons(data.config.yearly_carry_total ?? 0));
        calculateTotal();
      } else {
        setDays([]);
        // Try to load previous month's final storage state
        let prevMonth = config.month - 1;
        let prevYear = config.year;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }
        
        try {
          const prevData = await invoke<MonthData | null>("get_month_data", {
            year: prevYear,
            month: prevMonth,
          });
          
          if (prevData && prevData.days.length > 0) {
            const lastDay = prevData.days[prevData.days.length - 1];
            setInitialStorage(nonNegativeTons(lastDay.storage_state));
          } else {
            setInitialStorage(0.0);
          }
        } catch (e) {
          setInitialStorage(0.0);
        }
      }
    } catch (error) {
      console.error("Failed to load month data:", error);
      setError(`Greška pri učitavanju: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const distributedBudgetT = (): number => {
    if (yearlyProductionTotal > 0) return yearlyProductionTotal;
    if (decemberClosingStorage > yearStartStorage) {
      return decemberClosingStorage - yearStartStorage;
    }
    return 0;
  };

  const generateYearDistributed = async () => {
    const t = distributedBudgetT();
    if (t <= 0) {
      alert(
        "Za raspodelu unesite ukupnu proizvodnju ili oba polja (početak godine i kraj decembra) tako da je kraj > početka.",
      );
      return;
    }
    try {
      const baseConfig: WasteConfig = {
        ...config,
        year: config.year,
        yearly_carry_total: t,
        year_start_storage: yearStartStorage,
        december_closing_storage: decemberClosingStorage > 0 ? decemberClosingStorage : null,
      };
      const months = await invoke<MonthData[]>("generate_year_data", {
        baseConfig,
        yearStartStorage,
        yearlyCarryTotal: t,
        decemberClosingStorage: decemberClosingStorage > 0 ? decemberClosingStorage : null,
      });

      for (const monthData of months) {
        await invoke("save_month_data", { data: monthData });
      }

      const targetMonth = config.month;
      const m = months.find((x) => x.config.month === targetMonth) ?? months[0];
      setConfig(m.config);
      const initD = nonNegativeTons(m.initial_storage);
      setInitialStorage(initD);
      setDays(recomputeStorageForDays(m.days, initD));
      setYearStartStorage(nonNegativeTons(m.config.year_start_storage ?? yearStartStorage));
      setDecemberClosingStorage(nonNegativeTons(m.config.december_closing_storage ?? decemberClosingStorage));
      setYearlyProductionTotal(nonNegativeTons(m.config.yearly_carry_total ?? t));
      calculateTotal();
    } catch (error) {
      console.error("generate_year_data (distributed):", error);
      alert(`Greška pri generisanju (raspodela): ${error}`);
    }
  };

  const generateYearRandom = async () => {
    try {
      const ys = nonNegativeTons(yearStartStorage);
      const dec =
        decemberClosingStorage > 0 ? nonNegativeTons(decemberClosingStorage) : null;
      const baseConfig: WasteConfig = {
        ...config,
        year: config.year,
        yearly_carry_total: null,
        year_start_storage: ys,
        december_closing_storage: dec,
      };
      const months = await invoke<MonthData[]>("generate_year_data", {
        baseConfig,
        yearStartStorage: ys,
        yearlyCarryTotal: null,
        decemberClosingStorage: dec,
      });

      for (const monthData of months) {
        await invoke("save_month_data", { data: monthData });
      }

      const targetMonth = config.month;
      const m = months.find((x) => x.config.month === targetMonth) ?? months[0];
      setConfig(m.config);
      const initR = nonNegativeTons(m.initial_storage);
      setInitialStorage(initR);
      setDays(recomputeStorageForDays(m.days, initR));
      // Nasumično ne menja polja u formi (stanje, ukupna proizvodnja) — ostaju za sledeću raspodelu
      calculateTotal();
    } catch (error) {
      console.error("generate_year_data (random):", error);
      alert(`Greška pri generisanju (nasumično): ${error}`);
    }
  };

  /** Za nasumičan mesec: januar od 0; inače kraj prethodnog meseca (ignoriše polja u formi). */
  const getInitialStorageForMonthRandom = async (): Promise<number> => {
    if (config.month === 1) {
      return 0;
    }
    const prev = await invoke<MonthData | null>("get_month_data", {
      year: config.year,
      month: config.month - 1,
    });
    if (prev?.days?.length) {
      return nonNegativeTons(prev.days[prev.days.length - 1].storage_state);
    }
    return 0;
  };

  const getCarryFromPreviousMonth = async (): Promise<number | null> => {
    if (config.month <= 1) return null;
    const prev = await invoke<MonthData | null>("get_month_data", {
      year: config.year,
      month: config.month - 1,
    });
    if (!prev?.days?.length) return null;
    const last = [...prev.days].reverse().find((d) => d.produced > 0);
    return last ? nonNegativeTons(last.produced) : null;
  };

  const generateMonthRandom = async () => {
    try {
      const initSt = await getInitialStorageForMonthRandom();
      const carry = await getCarryFromPreviousMonth();
      const cfg: WasteConfig = {
        ...config,
        id: `${config.year}_${String(config.month).padStart(2, "0")}`,
        yearly_carry_total: null,
        year_start_storage: null,
        december_closing_storage: null,
      };
      const result = await invoke<MonthData>("regenerate_month_random", {
        config: cfg,
        initialStorage: initSt,
        carryFirstProduced: carry,
      });
      const initM = nonNegativeTons(result.initial_storage);
      const daysNorm = recomputeStorageForDays(result.days, initM);
      const monthPayload: MonthData = {
        config: result.config,
        days: daysNorm,
        initial_storage: initM,
      };
      await invoke("save_month_data", { data: monthPayload });
      setConfig(result.config);
      setInitialStorage(initM);
      setDays(daysNorm);
      calculateTotal();
    } catch (error) {
      console.error("regenerate_month_random:", error);
      alert(`Greška pri generisanju meseca: ${error}`);
    }
  };

  const saveCurrentMonth = async () => {
    try {
      const initS = nonNegativeTons(initialStorage);
      const daysNorm = recomputeStorageForDays(days, initS);
      const data: MonthData = {
        config: {
          ...config,
          id: `${config.year}_${String(config.month).padStart(2, "0")}`,
          yearly_carry_total:
            yearlyProductionTotal > 0
              ? nonNegativeTons(yearlyProductionTotal)
              : config.yearly_carry_total ?? null,
          year_start_storage: nonNegativeTons(yearStartStorage),
          december_closing_storage:
            decemberClosingStorage > 0 ? nonNegativeTons(decemberClosingStorage) : null,
        },
        days: daysNorm,
        initial_storage: initS,
      };
      await invoke("save_month_data", { data });
      setDays(daysNorm);
      setInitialStorage(initS);
    } catch (error) {
      console.error("save_month_data:", error);
      alert(`Greška pri čuvanju: ${error}`);
    }
  };

  const exportYearToExcel = async () => {
    try {
      // Load all months for the year
      const months: MonthData[] = [];
      for (let m = 1; m <= 12; m++) {
        try {
          const monthData = await invoke<MonthData | null>("get_month_data", {
            year: config.year,
            month: m,
          });
          if (monthData) {
            months.push(monthData);
          }
        } catch (e) {
          // Month doesn't exist, skip
        }
      }

      if (months.length === 0) {
        console.log("Nema podataka za izvoz! Molimo generišite podatke prvo.");
        return;
      }

      const filePath = await save({
        filters: [
          {
            name: "Excel",
            extensions: ["xlsx"],
          },
        ],
        defaultPath: `evidencija_${config.year}.xlsx`,
      });

      if (filePath) {
        await invoke("export_year_to_excel", {
          months: months,
          outputPath: filePath,
        });
        console.log("Excel fajl za celu godinu je uspešno kreiran!");
      }
    } catch (error) {
      console.error("Failed to export year:", error);
      alert(`Greška pri izvozu godine: ${error}`);
    }
  };


  const calculateTotal = () => {
    const total = days.reduce((sum, day) => sum + day.produced, 0);
    setTotalProduced(total);
  };

  useEffect(() => {
    loadMonthData().catch(console.error);
  }, [config.year, config.month]);

  useEffect(() => {
    calculateTotal();
  }, [days]);

  const theme = darkMode ? {
    bg: "#0d1117",
    surface: "#161b22",
    text: "#c9d1d9",
    textSecondary: "#8b949e",
    border: "#30363d",
    inputBg: "#21262d",
    buttonPrimary: "#dc2626", // MR Engines red
    buttonSecondary: "#6b6b6b",
    headerBg: "#161b22",
    cardBg: "#161b22",
  } : {
    bg: "#ffffff",
    surface: "#f8f9fa",
    text: "#1f2328",
    textSecondary: "#656d76",
    border: "#d1d9e0",
    inputBg: "#ffffff",
    buttonPrimary: "#dc2626", // MR Engines red
    buttonSecondary: "#6c757d",
    headerBg: "#f8f9fa",
    cardBg: "#ffffff",
  };

  const handleConfigChange = (newConfig: Partial<WasteConfig>) => {
    const next = { ...config, ...newConfig };
    if (newConfig.year !== undefined || newConfig.month !== undefined) {
      next.id = `${next.year}_${String(next.month).padStart(2, "0")}`;
    }
    setConfig(next);
  };

  const handleDayChange = (index: number, field: keyof DayData, value: number | string) => {
    const newDays = [...days];
    let v: number | string = value;
    if (field === "produced" || field === "delivered") {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isNaN(n)) {
        v = nonNegativeTons(n);
      }
    }
    newDays[index] = { ...newDays[index], [field]: v };

    // Stanje u mikro-jedinicama da odgovara Rust lancu (bez 0.001 drifta)
    let currentMicro = Math.round(nonNegativeTons(initialStorage) * 1000);
    for (let i = 0; i < newDays.length; i++) {
      const p = Number(newDays[i].produced);
      const add = Number.isFinite(p) ? nonNegativeTons(p) : 0;
      currentMicro += Math.round(add * 1000);
      newDays[i].storage_state = nonNegativeTons(currentMicro / 1000);
    }

    setDays(newDays);
  };


  const handleExportMonth = async (monthNum?: number) => {
    console.log("handleExportMonth called with month:", monthNum);
    
    const monthNames = [
      "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
      "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
    ];
    
    // If monthNum is not provided, show selector
    if (monthNum === undefined) {
      setShowMonthSelector(true);
      return;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      alert("Nevažeći mesec!");
      return;
    }

    setShowMonthSelector(false);

    try {
      console.log(`Loading data for month ${monthNum}, year ${config.year}`);
      
      // Load data for selected month
      const monthData = await invoke<MonthData | null>("get_month_data", {
        year: config.year,
        month: monthNum,
      });

      console.log("Month data loaded:", monthData ? `Found ${monthData.days.length} days` : "No data");

      if (!monthData || monthData.days.length === 0) {
        alert(`Nema podataka za ${monthNames[monthNum]} ${config.year}! Molimo generišite podatke prvo.`);
        return;
      }

      console.log("Opening save dialog...");
      const filePath = await save({
        filters: [
          {
            name: "Excel",
            extensions: ["xlsx"],
          },
        ],
        defaultPath: `evidencija_${config.year}_${monthNum.toString().padStart(2, "0")}.xlsx`,
      });

      console.log("File path from dialog:", filePath);

      if (!filePath) {
        console.log("User cancelled file selection");
        return;
      }

      console.log("Calling export_to_excel with path:", filePath);
      console.log("Month data:", {
        year: monthData.config.year,
        month: monthData.config.month,
        daysCount: monthData.days.length,
      });
      
      console.log("Calling export_to_excel with:", {
        dataExists: !!monthData,
        filePath: filePath,
      });
      
      await invoke("export_to_excel", {
        data: monthData,
        outputPath: filePath,
      });
      
      console.log("Export completed successfully");
      alert(`Excel fajl je uspešno kreiran za ${monthNames[monthNum]} ${config.year}!`);
    } catch (error) {
      console.error("Failed to export:", error);
      // Fallback: use native file path
      try {
        const homeDir = await invoke<string>("get_home_dir");
        const fallbackPath = `${homeDir}/Downloads/evidencija_${config.year}_${monthNum.toString().padStart(2, "0")}.xlsx`;
        console.log("Trying fallback path:", fallbackPath);
        const monthDataFallback = await invoke<MonthData | null>("get_month_data", {
          year: config.year,
          month: monthNum,
        });
        if (monthDataFallback) {
          await invoke("export_to_excel", {
            data: monthDataFallback,
            outputPath: fallbackPath,
          });
          console.log(`Excel fajl je sačuvan u Downloads folderu!`);
          alert(`Excel fajl je sačuvan u Downloads folderu!`);
        } else {
          alert(`Nema podataka za ${monthNames[monthNum]} ${config.year}!`);
        }
      } catch (fallbackError) {
        console.error("Fallback export failed:", fallbackError);
        alert(`Greška pri izvozu u Excel: ${error}`);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center", 
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
      }}>
        <Loader2 size={32} style={{ margin: "0 auto 10px", animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: "16px" }}>Učitavanje...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center",
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
      }}>
        <AlertTriangle size={32} style={{ margin: "0 auto 10px", color: "#dc2626" }} />
        <p style={{ color: "#dc2626", marginBottom: "20px", fontSize: "16px" }}>{error}</p>
        <button 
          onClick={() => loadMonthData()}
          style={{
            padding: "12px 24px",
            backgroundColor: theme.buttonPrimary,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Pokušaj ponovo
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "1400px", 
      margin: "0 auto", 
      backgroundColor: theme.bg, 
      minHeight: "100vh",
      color: theme.text,
      transition: "background-color 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, color: theme.text, fontSize: "28px", fontWeight: "600" }}>
          Dnevna evidencija otpada
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: "10px 20px",
            backgroundColor: theme.buttonPrimary,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: darkMode ? "0 2px 8px rgba(220, 38, 38, 0.3)" : "0 2px 4px rgba(220, 38, 38, 0.2)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = darkMode ? "0 4px 12px rgba(220, 38, 38, 0.4)" : "0 4px 8px rgba(220, 38, 38, 0.3)";
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = darkMode ? "0 2px 8px rgba(220, 38, 38, 0.3)" : "0 2px 4px rgba(220, 38, 38, 0.2)";
            e.currentTarget.style.backgroundColor = theme.buttonPrimary;
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{darkMode ? "Svetli režim" : "Tamni režim"}</span>
        </button>
      </div>
      
      <ConfigManager
        currentConfig={config}
        onConfigSelect={(selectedConfig) => {
          setConfig(selectedConfig);
          setInitialStorage(0.0);
          setYearStartStorage(nonNegativeTons(selectedConfig.year_start_storage ?? 0));
          setDecemberClosingStorage(nonNegativeTons(selectedConfig.december_closing_storage ?? 0));
          setYearlyProductionTotal(nonNegativeTons(selectedConfig.yearly_carry_total ?? 0));
        }}
        darkMode={darkMode}
      />
      
      <HeaderForm
        config={config}
        yearStartStorage={yearStartStorage}
        decemberClosingStorage={decemberClosingStorage}
        yearlyProductionTotal={yearlyProductionTotal}
        onConfigChange={handleConfigChange}
        onYearStartChange={setYearStartStorage}
        onDecemberClosingChange={setDecemberClosingStorage}
        onYearlyProductionChange={setYearlyProductionTotal}
        onGenerateYearDistributed={generateYearDistributed}
        onGenerateYearRandom={generateYearRandom}
        onGenerateMonthRandom={generateMonthRandom}
        onSaveMonth={saveCurrentMonth}
        darkMode={darkMode}
      />

      <MonthTabs
        selectedMonth={config.month}
        onMonthChange={(m) => handleConfigChange({ month: m })}
        darkMode={darkMode}
      />
      
      <WasteTable
        days={days}
        totalProduced={totalProduced}
        onDayChange={handleDayChange}
        darkMode={darkMode}
      />
      
      <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        <button
          onClick={exportYearToExcel}
          style={{
            padding: "14px 32px",
            backgroundColor: theme.buttonPrimary,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)",
            transition: "all 0.2s",
            minWidth: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(220, 38, 38, 0.4)";
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(220, 38, 38, 0.3)";
            e.currentTarget.style.backgroundColor = theme.buttonPrimary;
          }}
        >
          <Download size={18} style={{ marginRight: "8px" }} />
          Izvezi celu godinu
        </button>
        <button
          onClick={() => handleExportMonth()}
          style={{
            padding: "14px 32px",
            backgroundColor: theme.buttonPrimary,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)",
            transition: "all 0.2s",
            minWidth: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(220, 38, 38, 0.4)";
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(220, 38, 38, 0.3)";
            e.currentTarget.style.backgroundColor = theme.buttonPrimary;
          }}
        >
          <FileText size={18} />
          Izvezi mesec
        </button>
      </div>

      {showMonthSelector && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowMonthSelector(false)}
        >
          <div
            style={{
              backgroundColor: theme.surface,
              padding: "30px",
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              minWidth: "400px",
              maxWidth: "500px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
              Izaberi mesec za izvoz
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {[
                "Januar", "Februar", "Mart", "April", "Maj", "Jun",
                "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
              ].map((name, index) => (
                <button
                  key={index + 1}
                  onClick={() => handleExportMonth(index + 1)}
                  style={{
                    padding: "12px",
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonPrimary;
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = theme.buttonPrimary;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = theme.inputBg;
                    e.currentTarget.style.color = theme.text;
                    e.currentTarget.style.borderColor = theme.border;
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMonthSelector(false)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: theme.buttonSecondary,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Otkaži
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

