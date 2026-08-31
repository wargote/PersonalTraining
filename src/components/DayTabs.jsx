import { weekdays } from "../lib/routine";

export default function DayTabs({ activeDay, setActiveDay, days }) {
  return (
    <div style={{ display: "flex", gap: "3px", overflowX: "auto", scrollbarWidth: "none", marginBottom: "20px" }}>
      {weekdays.map(({ id, label }) => {
        const day = days.find((d) => d.id === id);
        const isRest = !day;
        const isActive = day && day.id === activeDay.id;
        return (
          <button
            key={label}
            onClick={() => day && setActiveDay(day)}
            style={{
              flex: "0 0 auto",
              padding: "10px 12px",
              background: isActive ? activeDay.color : isRest ? "#0D0D0D" : "#141414",
              color: isActive ? "#0A0A0A" : isRest ? "#222" : "#9C9C9C",
              border: "none",
              borderRadius: "8px",
              cursor: isRest ? "default" : "pointer",
              fontSize: "10px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "1px",
              fontWeight: isActive ? "700" : "400",
              transition: "all 0.15s",
              minWidth: "46px",
              textAlign: "center",
            }}
          >
            {label}
            <div style={{ fontSize: "8px", marginTop: "2px", color: isActive ? "#0A0A0A77" : isRest ? "#1A1A1A" : "#5A5A5A" }}>
              {isRest ? "REST" : day.type}
            </div>
          </button>
        );
      })}
    </div>
  );
}
