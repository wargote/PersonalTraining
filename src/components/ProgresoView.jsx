import { fmtDate, fmtKg } from "../lib/logs";

export default function ProgresoView({ workout, activeDay }) {
  const stats = workout.stats;

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#7E7E7E", marginBottom: "16px" }}>TU PROGRESO</div>

      {/* Resumen: sesiones, kg totales movidos y semana actual */}
      {(() => {
        const w = stats.weekly;
        const cur = w.length ? w[w.length - 1] : null;
        const prev = w.length > 1 ? w[w.length - 2] : null;
        const delta = cur && prev && prev.vol > 0 ? Math.round(((cur.vol - prev.vol) / prev.vol) * 100) : null;
        const cards = [
          { label: "SESIONES", value: String(stats.totalSessions), sub: "registradas" },
          { label: "KG MOVIDOS", value: fmtKg(stats.totalVol), sub: "tonelaje total" },
          {
            label: "ESTA SEMANA",
            value: cur ? fmtKg(cur.vol) : "0",
            sub: delta != null ? `${delta > 0 ? "▲" : delta < 0 ? "▼" : "="} ${Math.abs(delta)}% vs anterior` : "kg movidos",
            subColor: delta != null && delta !== 0 ? (delta > 0 ? "#47FF88" : "#FF6B6B") : "#7E7E7E",
          },
        ];
        return (
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {cards.map((c) => (
              <div key={c.label} style={{
                flex: 1, background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px",
                padding: "12px 10px", textAlign: "center", minWidth: 0,
              }}>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#F0F0F0", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
                  {c.value}
                </div>
                <div style={{ fontSize: "8px", letterSpacing: "1px", color: "#8E8E8E", marginTop: "5px", textTransform: "uppercase" }}>
                  {c.label}
                </div>
                <div style={{ fontSize: "8px", color: c.subColor || "#7E7E7E", marginTop: "3px" }}>{c.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Gráfica de volumen semanal */}
      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#8E8E8E", marginBottom: "10px", textTransform: "uppercase" }}>
        Volumen por semana (kg movidos)
      </div>
      {(() => {
        const pts = stats.weekly.slice(-12); // últimas 12 semanas
        if (pts.length < 2) {
          return (
            <div style={{ fontSize: "11px", color: "#8E8E8E", lineHeight: 1.6, background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              Registra peso <strong>y repeticiones</strong> en al menos dos semanas distintas y aquí verás cómo evoluciona el total de kilos que mueves. El volumen = peso × repeticiones de cada serie.
            </div>
          );
        }
        const W = 320, H = 120, padX = 10, padY = 14;
        const vols = pts.map((p) => p.vol);
        const max = Math.max(...vols), min = Math.min(...vols, 0);
        const range = max - min || 1;
        const x = (i) => padX + (i * (W - padX * 2)) / (pts.length - 1);
        const y = (v) => H - padY - ((v - min) / range) * (H - padY * 2);
        const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.vol).toFixed(1)}`).join(" ");
        const area = `${line} L ${x(pts.length - 1).toFixed(1)} ${H - padY} L ${x(0).toFixed(1)} ${H - padY} Z`;
        const c = activeDay.color;
        return (
          <div style={{ background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px", padding: "14px", marginBottom: "24px" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
              <defs>
                <linearGradient id="g-prog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={c} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#g-prog)" />
              <path d={line} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.vol)} r={i === pts.length - 1 ? 3.5 : 2.2} fill={c} />
              ))}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#7E7E7E", marginTop: "6px" }}>
              <span>{fmtDate(pts[0].week)}</span>
              <span>máx {fmtKg(max)} kg · {pts.length} sem</span>
              <span>{fmtDate(pts[pts.length - 1].week)}</span>
            </div>
          </div>
        );
      })()}

      {/* Ejercicios que más subiste */}
      {stats.improved.length > 0 && (
        <>
          <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#8E8E8E", marginBottom: "10px", textTransform: "uppercase" }}>
            Ejercicios que más subiste
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
            {stats.improved.map((ex) => (
              <div key={ex.name} style={{
                background: "#111", border: "1px solid #1A1A1A", borderRadius: "10px",
                padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: ex.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "#DDD", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", lineHeight: 1.3 }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: "9px", color: "#9C9C9C", whiteSpace: "nowrap" }}>{ex.from}→{ex.to} kg</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#47FF88", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                  +{ex.deltaPct}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Notas recientes */}
      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#8E8E8E", marginBottom: "10px", textTransform: "uppercase" }}>
        Notas recientes
      </div>
      {stats.notes.length === 0 ? (
        <div style={{ fontSize: "11px", color: "#8E8E8E", lineHeight: 1.6, background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px", padding: "16px" }}>
          Aún no has escrito notas. En la pestaña <span style={{ color: activeDay.color }}>RUTINA</span> apunta cómo te sentiste y tu esfuerzo (RPE) de cada sesión; aparecerán aquí.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {stats.notes.map((n) => {
            const rpeColor = n.rpe == null ? "#7E7E7E" : n.rpe >= 9 ? "#FF6B6B" : n.rpe >= 7 ? "#FFD447" : "#47FF88";
            return (
              <div key={`${n.dayId}::${n.date}`} style={{
                background: "#111", border: "1px solid #1A1A1A", borderRadius: "10px", padding: "10px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: n.note ? "5px" : 0 }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: n.day ? n.day.color : "#888", flexShrink: 0 }} />
                  <div style={{ fontSize: "9px", letterSpacing: "1px", color: "#9C9C9C", textTransform: "uppercase" }}>
                    {n.day ? n.day.type : n.dayId} · {fmtDate(n.date)}
                  </div>
                  {n.rpe != null && (
                    <div style={{
                      marginLeft: "auto", fontSize: "9px", fontWeight: "700", color: "#0A0A0A",
                      background: rpeColor, padding: "1px 7px", borderRadius: "4px", whiteSpace: "nowrap",
                    }}>
                      RPE {n.rpe}
                    </div>
                  )}
                </div>
                {n.note && (
                  <div style={{ fontSize: "12px", color: "#DDD", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
