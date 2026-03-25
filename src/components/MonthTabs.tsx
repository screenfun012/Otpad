const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Avg", "Sep", "Okt", "Nov", "Dec",
];

interface MonthTabsProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  darkMode?: boolean;
}

export default function MonthTabs({
  selectedMonth,
  onMonthChange,
  darkMode = false,
}: MonthTabsProps) {
  const theme = darkMode ? {
    border: "#30363d",
    surface: "#161b22",
    text: "#c9d1d9",
    activeBg: "#dc2626",
    inactiveBg: "#21262d",
    hint: "#8b949e",
  } : {
    border: "#d1d9e0",
    surface: "#f8f9fa",
    text: "#1f2328",
    activeBg: "#dc2626",
    inactiveBg: "#ffffff",
    hint: "#656d76",
  };

  return (
    <div
      style={{
        marginBottom: "20px",
        maxWidth: "960px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: theme.text,
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        Meseci (izaberite mesec za tabelu ispod)
      </div>
      <div
        role="tablist"
        aria-label="Meseci"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "8px",
          padding: "12px",
          borderRadius: "12px",
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.surface,
        }}
      >
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1;
          const active = selectedMonth === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active ? "true" : "false"}
              onClick={() => onMonthChange(m)}
              style={{
                padding: "10px 6px",
                borderRadius: "8px",
                border: `1px solid ${active ? theme.activeBg : theme.border}`,
                backgroundColor: active ? theme.activeBg : theme.inactiveBg,
                color: active ? "#fff" : theme.text,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                transition: "all 0.15s",
                textAlign: "center",
                minHeight: "40px",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: "12px",
          color: theme.hint,
          textAlign: "center",
          lineHeight: 1.45,
        }}
      >
        Ručne izmene u tabeli odmah preračunavaju „Stanje“ za taj mesec (od početnog stanja meseca).
      </p>
    </div>
  );
}
