const TABS = [
  { id: "rutina", label: "RUTINA", icon: "🏋️" },
  { id: "progreso", label: "PROGRESO", icon: "📈" },
  { id: "volumen", label: "VOLUMEN", icon: "📊" },
  { id: "records", label: "PRs", icon: "🏆" },
  { id: "perfil", label: "PERFIL", icon: "👤" },
];

export default function BottomNav({ view, setView, activeDay }) {
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20,
      display: "flex", background: "#0A0A0A", borderTop: "1px solid #1A1A1A",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {TABS.map((tab) => {
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: "3px", padding: "9px 4px 8px", background: "transparent", border: "none",
              cursor: "pointer", fontFamily: "'DM Mono', monospace",
              color: active ? activeDay.color : "#7E7E7E",
              transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: "17px", lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: "8px", letterSpacing: "1px", fontWeight: active ? "700" : "400" }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
