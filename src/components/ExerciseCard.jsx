import { muscleColors } from "../data/routine";
import { normalizeReps, weightsLabel, getPR, fmtDate } from "../lib/logs";

export default function ExerciseCard({ ex, exIdx, activeDay, workout, completedCount }) {
  const dayId = activeDay.id;
  const name = ex.name;
  const allDone = completedCount === ex.sets;
  const history = workout.getHistory(dayId, name);
  const last = history[0] || null;
  const delta = workout.getDelta(history);
  const pr = getPR(history);
  const savedToday = last && last.date === workout.todayStr();
  const lastReps = normalizeReps(last);
  const isOpen = workout.openHistory[workout.getWeightKey(dayId, name)];

  return (
    <div style={{
      background: allDone ? "#0D1A0D" : "#111",
      border: `1px solid ${allDone ? "#47FF8830" : "#1A1A1A"}`,
      borderRadius: "12px", padding: "14px", transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ flex: 1, paddingRight: "10px" }}>
          <div style={{
            display: "inline-block",
            background: (muscleColors[ex.muscle] || "#888") + "18",
            color: muscleColors[ex.muscle] || "#888",
            fontSize: "8px", letterSpacing: "2px", padding: "2px 7px",
            borderRadius: "4px", marginBottom: "5px", textTransform: "uppercase",
          }}>
            {ex.muscle}
          </div>
          <div style={{
            fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: "600",
            color: allDone ? "#47FF88" : "#F0F0F0", lineHeight: 1.3, marginBottom: "3px",
          }}>
            {ex.name}
          </div>
          <div style={{ fontSize: "10px", color: "#7E7E7E", lineHeight: 1.4 }}>{ex.note}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: activeDay.color, fontFamily: "'DM Sans', sans-serif" }}>
            {ex.sets}×{ex.reps}
          </div>
          <div style={{ fontSize: "9px", color: "#5A5A5A", marginTop: "2px" }}>{completedCount}/{ex.sets}</div>
        </div>
      </div>

      {/* Referencia: último registro + PR (una sola vez por ejercicio) */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
        marginBottom: "8px", fontSize: "9px", letterSpacing: "1px",
      }}>
        {last ? (
          <>
            <span style={{ color: "#7E7E7E", textTransform: "uppercase" }}>
              {savedToday ? "HOY" : "ÚLTIMO"}
            </span>
            <span style={{ color: "#888", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", fontSize: "11px" }}>
              {weightsLabel(last)} kg{lastReps.length ? ` · ${lastReps.join("/")}` : ""}
            </span>
            <span style={{ color: "#5A5A5A" }}>· {fmtDate(last.date)}</span>
            {delta !== null && delta !== 0 && (
              <span style={{
                color: delta > 0 ? "#47FF88" : "#FF6B6B",
                background: (delta > 0 ? "#47FF88" : "#FF6B6B") + "15",
                padding: "1px 6px", borderRadius: "4px", fontWeight: "700",
              }}>
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}kg
              </span>
            )}
          </>
        ) : (
          <span style={{ color: "#5A5A5A", textTransform: "uppercase" }}>Sin registro previo</span>
        )}
        {pr && (
          <span style={{
            color: "#FFD447", background: "#FFD44715",
            padding: "1px 6px", borderRadius: "4px", fontWeight: "700",
            whiteSpace: "nowrap",
          }}>
            ★ PR {pr.weight}{pr.reps.length ? `·${pr.reps.join("/")}` : ""}
          </span>
        )}
        {history.length > 0 && (
          <button
            onClick={() => workout.toggleHistory(dayId, name)}
            style={{
              marginLeft: "auto", background: "transparent", border: "none",
              color: "#8E8E8E", fontSize: "9px", letterSpacing: "1px", cursor: "pointer",
              fontFamily: "'DM Mono', monospace", padding: 0,
            }}
          >
            {isOpen ? "OCULTAR" : `HISTORIAL (${history.length})`}
          </button>
        )}
      </div>

      {/* Una fila por serie: peso (± 2.5kg) · reps · check que guarda */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: isOpen ? "8px" : 0 }}>
        {Array.from({ length: ex.sets }, (_, setIdx) => {
          const done = workout.isSetDone(dayId, name, setIdx);
          const weightVal = workout.getSetWeight(dayId, name, setIdx);
          const weightPlaceholder = workout.getSetWeightPlaceholder(dayId, name, setIdx);
          const repVal = workout.getRepValue(dayId, name, setIdx);
          const repPlaceholder = workout.getRepPlaceholder(dayId, name, setIdx);
          const canSave = done || Boolean(weightVal || weightPlaceholder);

          const commitOnEnter = (e) => {
            if (e.key === "Enter") { workout.saveSet(dayId, name, setIdx); e.target.blur(); }
          };

          return (
            <div
              key={setIdx}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 8px", borderRadius: "8px",
                border: `1px solid ${done ? activeDay.color : "#1A1A1A"}`,
                background: done ? activeDay.color + "10" : "#0A0A0A",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: "8px", color: "#8E8E8E", fontFamily: "'DM Mono', monospace", letterSpacing: "1px", width: "16px", flexShrink: 0 }}>
                S{setIdx + 1}
              </span>

              <button
                onClick={() => workout.bumpSetWeight(dayId, name, setIdx, -2.5)}
                style={{
                  width: "22px", height: "22px", borderRadius: "5px", flexShrink: 0,
                  border: "1px solid #222", background: "transparent", color: "#9C9C9C",
                  fontSize: "13px", cursor: "pointer", fontFamily: "'DM Mono', monospace",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                −
              </button>
              <input
                type="number"
                inputMode="decimal"
                placeholder={weightPlaceholder || "—"}
                value={weightVal}
                onChange={(e) => workout.setSetWeight(dayId, name, setIdx, e.target.value)}
                onKeyDown={commitOnEnter}
                style={{
                  width: "42px", background: "transparent", border: "none", outline: "none",
                  color: activeDay.color, fontSize: "13px", fontWeight: "700",
                  fontFamily: "'DM Sans', sans-serif", textAlign: "center",
                }}
              />
              <button
                onClick={() => workout.bumpSetWeight(dayId, name, setIdx, 2.5)}
                style={{
                  width: "22px", height: "22px", borderRadius: "5px", flexShrink: 0,
                  border: "1px solid #222", background: "transparent", color: "#9C9C9C",
                  fontSize: "13px", cursor: "pointer", fontFamily: "'DM Mono', monospace",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                +
              </button>
              <span style={{ fontSize: "9px", color: "#7E7E7E", flexShrink: 0 }}>kg</span>

              <input
                type="number"
                inputMode="numeric"
                placeholder={repPlaceholder || "reps"}
                value={repVal}
                onChange={(e) => workout.setRepDraft(dayId, name, setIdx, e.target.value)}
                onKeyDown={commitOnEnter}
                style={{
                  width: "34px", background: "transparent", border: "none", outline: "none",
                  color: repVal !== "" ? "#F0F0F0" : "#9C9C9C",
                  fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", textAlign: "center",
                  marginLeft: "4px",
                }}
              />
              <span style={{ fontSize: "9px", color: "#7E7E7E", flexShrink: 0 }}>reps</span>

              <div style={{ flex: 1 }} />
              <button
                onClick={() => workout.toggleSet(dayId, name, setIdx)}
                disabled={!canSave}
                title={done ? "Marcar serie sin hacer" : "Marcar serie hecha (guarda peso + reps)"}
                style={{
                  width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
                  border: `1px solid ${done ? activeDay.color : "#222"}`,
                  background: done ? activeDay.color : "transparent",
                  color: done ? "#0A0A0A" : canSave ? "#9C9C9C" : "#3A3A3A",
                  fontSize: "12px", fontWeight: "700", cursor: canSave ? "pointer" : "default",
                  transition: "all 0.12s", fontFamily: "'DM Mono', monospace",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {done ? "✓" : "○"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Lista de historial */}
      {isOpen && (
        <div style={{
          padding: "6px 10px",
          background: "#0A0A0A", borderRadius: "8px", border: "1px solid #161616",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          {/* Mini-gráfico de evolución */}
          {(() => {
            const pts = [...history].reverse()
              .map((e) => ({ w: parseFloat(e.weight), date: e.date }))
              .filter((p) => !isNaN(p.w));
            if (pts.length < 2) {
              return (
                <div style={{ fontSize: "9px", color: "#7E7E7E", marginBottom: "4px", lineHeight: 1.5 }}>
                  Registra el peso en otra sesión (otro día) para ver la gráfica de evolución.
                </div>
              );
            }
            const W = 240, H = 56, pad = 8;
            const ws = pts.map((p) => p.w);
            const min = Math.min(...ws), max = Math.max(...ws);
            const range = max - min || 1;
            const x = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
            const y = (w) => H - pad - ((w - min) / range) * (H - pad * 2);
            const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.w).toFixed(1)}`).join(" ");
            const area = `${line} L ${x(pts.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
            const c = activeDay.color;
            return (
              <div style={{ marginBottom: "4px" }}>
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="56" preserveAspectRatio="none" style={{ display: "block" }}>
                  <defs>
                    <linearGradient id={`g-${exIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={c} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill={`url(#g-${exIdx})`} />
                  <path d={line} fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((p, i) => (
                    <circle key={i} cx={x(i)} cy={y(p.w)} r={i === pts.length - 1 ? 3 : 2} fill={c} />
                  ))}
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#7E7E7E", marginTop: "2px" }}>
                  <span>{min} kg</span>
                  <span>{pts.length} sesiones · máx {max} kg</span>
                </div>
              </div>
            );
          })()}
          {history.map((entry, i) => {
            const prevW = history[i + 1] ? parseFloat(history[i + 1].weight) : null;
            const curW = parseFloat(entry.weight);
            const d = prevW !== null && !isNaN(prevW) && !isNaN(curW) ? Math.round((curW - prevW) * 100) / 100 : null;
            const isPR = pr && entry.date === pr.date;
            return (
              <div key={entry.date} style={{
                display: "flex", alignItems: "center", gap: "8px",
                fontSize: "10px", color: "#AAAAAA",
              }}>
                <span style={{ color: "#8E8E8E", minWidth: "44px" }}>{fmtDate(entry.date)}</span>
                <span style={{ color: "#AAA", fontWeight: "700", fontFamily: "'DM Sans', sans-serif" }}>
                  {weightsLabel(entry)} kg{normalizeReps(entry).length ? ` · ${normalizeReps(entry).join("/")}` : ""}
                </span>
                {isPR && <span style={{ color: "#FFD447", fontSize: "9px" }} title="Récord personal">★</span>}
                {d !== null && d !== 0 && (
                  <span style={{ color: d > 0 ? "#47FF88" : "#FF6B6B", fontSize: "9px" }}>
                    {d > 0 ? "+" : ""}{d}
                  </span>
                )}
                <button
                  onClick={() => workout.deleteEntry(dayId, name, entry.date)}
                  style={{
                    marginLeft: "auto", background: "transparent", border: "none",
                    color: "#7E7E7E", fontSize: "12px", cursor: "pointer", padding: "0 2px",
                    lineHeight: 1,
                  }}
                  title="Eliminar registro"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
