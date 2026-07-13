import { volumeSummary, muscleColors } from "../data/routine";

export default function VolumenView() {
  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#7E7E7E", marginBottom: "16px" }}>SERIES SEMANALES POR MÚSCULO</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {volumeSummary.map(({ m, s, days: d }) => (
          <div key={m} style={{
            background: "#111", border: "1px solid #1A1A1A", borderRadius: "10px",
            padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: muscleColors[m] || "#888", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#DDD", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" }}>{m}</div>
              <div style={{ fontSize: "10px", color: "#7E7E7E", marginTop: "2px" }}>{d}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "60px", height: "4px", background: "#1A1A1A", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min((s / 20) * 100, 100)}%`, height: "100%", background: muscleColors[m] || "#888", borderRadius: "2px" }} />
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: muscleColors[m] || "#888", minWidth: "24px", textAlign: "right" }}>{s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
