import { useState, useEffect } from "react";
import HeaderForm from "./components/HeaderForm";
import WasteTable from "./components/WasteTable";
import ConfigManager from "./components/ConfigManager";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Moon, Sun, Download, FileText, Loader2, AlertTriangle } from "lucide-react";
import type { WasteConfig, DayData, MonthData } from "./types";

function App() {
  const [config, setConfig] = useState<WasteConfig>({
    id: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    index_number: "170402",
    waste_name: "Отпадни алуминијум",
    waste_description: "неопасан отпад",
    record_keeper: "Наташа Јевтић",
  });

  const [days, setDays] = useState<DayData[]>([]);
  const [initialStorage, setInitialStorage] = useState(0.0);
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
        setDays(data.days);
        setInitialStorage(data.initial_storage);
        calculateTotal();
      } else {
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
            // Use last day's storage state as initial storage for new month
            const lastDay = prevData.days[prevData.days.length - 1];
            setInitialStorage(lastDay.storage_state);
          } else {
            setInitialStorage(0.0);
          }
        } catch (e) {
          // No previous month data, start from 0
          setInitialStorage(0.0);
        }
        
        // Don't auto-generate, let user click generate button
      }
    } catch (error) {
      console.error("Failed to load month data:", error);
      setError(`Greška pri učitavanju: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const generateData = async () => {
    // Generate for entire year
    await generateYearData();
  };


  const generateYearData = async () => {
    try {
      const months = await invoke<MonthData[]>("generate_year_data", {
        year: config.year,
        initialStorage: initialStorage,
      });

      console.log("Generated months:", months.length);

      // Save all months
      for (const monthData of months) {
        await invoke("save_month_data", { data: monthData });
      }

      // Load first month (January) after generating year data
      if (months.length > 0) {
        const firstMonth = months[0];
        
        // Recalculate storage states to ensure they're correct
        let currentStorage = firstMonth.initial_storage;
        const recalculatedDays = firstMonth.days.map((day) => {
          currentStorage += day.produced;
          return {
            ...day,
            storage_state: currentStorage,
          };
        });

        setConfig(firstMonth.config);
        setDays(recalculatedDays);
        setInitialStorage(firstMonth.initial_storage);
        calculateTotal();
      }

      console.log(`Podaci za celu godinu ${config.year} su generisani i sačuvani!`);
    } catch (error) {
      console.error("Failed to generate year data:", error);
      alert(`Greška pri generisanju podataka za godinu: ${error}`);
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
    setConfig({ ...config, ...newConfig });
  };

  const handleDayChange = (index: number, field: keyof DayData, value: number | string) => {
    const newDays = [...days];
    newDays[index] = { ...newDays[index], [field]: value };

    // Recalculate storage states
    let currentStorage = initialStorage;
    for (let i = 0; i < newDays.length; i++) {
      currentStorage += newDays[i].produced;
      newDays[i].storage_state = currentStorage;
    }

    setDays(newDays);
  };


  const handleExportMonth = async (monthNum?: number) => {
    console.log("handleExportMonth called with month:", monthNum);
    
    const monthNames = [
      "", "Јануар", "Фебруар", "Март", "Април", "Мај", "Јун",
      "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"
    ];
    
    // If monthNum is not provided, show selector
    if (monthNum === undefined) {
      setShowMonthSelector(true);
      return;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      alert("Неважећи месец!");
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
        alert(`Нема података за ${monthNames[monthNum]} ${config.year}! Молимо генеришите податке прво.`);
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
      alert(`Excel fajl је успешно креиран за ${monthNames[monthNum]} ${config.year}!`);
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
          console.log(`Excel fajl је сачуван у Downloads folderу!`);
          alert(`Excel fajl је сачуван у Downloads folderу!`);
        } else {
          alert(`Нема података за ${monthNames[monthNum]} ${config.year}!`);
        }
      } catch (fallbackError) {
        console.error("Fallback export failed:", fallbackError);
        alert(`Грешка при извозу у Excel: ${error}`);
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
        <p style={{ fontSize: "16px" }}>Учитавање...</p>
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
          Покушај поново
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
          Дневна евиденција отпада
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
          <span>{darkMode ? "Светли режим" : "Тамни режим"}</span>
        </button>
      </div>
      
      <ConfigManager
        currentConfig={config}
        onConfigSelect={(selectedConfig) => {
          setConfig(selectedConfig);
          setInitialStorage(0.0);
        }}
        darkMode={darkMode}
      />
      
      <HeaderForm
        config={config}
        initialStorage={initialStorage}
        onConfigChange={handleConfigChange}
        onInitialStorageChange={setInitialStorage}
        onGenerate={generateData}
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
          Извези целу годину
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
          Извези месец
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
              Изабери месец за извоз
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
                "Јануар", "Фебруар", "Март", "Април", "Мај", "Јун",
                "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"
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
              Откажи
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

