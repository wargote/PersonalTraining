import { days } from "../data/routine";
import { getPR, fmtDate } from "../lib/logs";

export default function RecordsView({ workout, activeDay }) {
  const dayGroups = days.map((day) => {
    const rows = day.exercises
      .map((ex) => {
        const hist = workout.getHistory(day.id, ex.name);
        const pr = getPR(hist);
        return pr ? { ex, pr, sessions: hist.length } : null;
      })
      .filter(Boolean);
    return { day, rows };
  }).filter((g) => g.rows.length > 0);

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#7E7E7E", marginBottom: "16px" }}>RÉCORDS PERSONALES POR EJERCICIO</div>
      {dayGroups.length === 0 ? (
        <div style={{ fontSize: "11px", color: "#8E8E8E", lineHeight: 1.6, background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px", padding: "16px" }}>
          Aún no tienes récords. Registra el peso y las reps de un ejercicio en la pestaña <span style={{ color: activeDay.color }}>RUTINA</span> y aparecerán aquí.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {dayGroups.map(({ day, rows }) => (
            <div key={day.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: day.color }} />
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: day.color, textTransform: "uppercase" }}>
                  {day.type} · {day.fullLabel}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {rows.map(({ ex, pr, sessions }) => (
                  <div key={ex.name} style={{
                    background: "#111", border: "1px solid #1A1A1A", borderRadius: "10px",
                    padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: "#DDD", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", lineHeight: 1.3 }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: "9px", color: "#7E7E7E", marginTop: "2px", letterSpacing: "1px" }}>
                        {fmtDate(pr.date)} · {sessions} {sessions === 1 ? "sesión" : "sesiones"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFD447", fontFamily: "'DM Sans', sans-serif" }}>
                        {pr.weight} kg
                      </div>
                      {pr.reps.length > 0 && (
                        <div style={{ fontSize: "9px", color: "#9C9C9C", marginTop: "1px" }}>
                          {pr.reps.join("/")} reps
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
