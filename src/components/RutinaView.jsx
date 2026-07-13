import DayTabs from "./DayTabs";
import ExerciseCard from "./ExerciseCard";
import { fmtDate } from "../lib/logs";

export default function RutinaView({ activeDay, setActiveDay, workout }) {
  const dayProgress = activeDay.exercises.map((ex) =>
    Array.from({ length: ex.sets }, (_, i) => workout.isSetDone(activeDay.id, ex.name, i)).filter(Boolean).length
  );
  const totalSets = activeDay.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = dayProgress.reduce((a, b) => a + b, 0);
  const progressPct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  const today = workout.todayStr();
  const saved = workout.getSavedNote(activeDay.id, today);
  const draft = workout.getNoteDraft(activeDay.id, today);
  const dirty =
    (draft.rpe ?? null) !== (saved.rpe ?? null) ||
    (draft.note || "").trim() !== (saved.note || "").trim();
  const rpeColor = (v) => (v >= 9 ? "#FF6B6B" : v >= 7 ? "#FFD447" : "#47FF88");

  return (
    <>
      <DayTabs activeDay={activeDay} setActiveDay={setActiveDay} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: activeDay.color, textTransform: "uppercase", marginBottom: "4px" }}>
            {activeDay.type} — {activeDay.fullLabel}
          </div>
          <div style={{ fontSize: "12px", color: "#9C9C9C" }}>{activeDay.focus}</div>
        </div>
        <div style={{
          background: activeDay.color + "15", border: `1px solid ${activeDay.color}30`,
          borderRadius: "8px", padding: "8px 12px", textAlign: "center", minWidth: "52px",
        }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: activeDay.color, fontFamily: "'DM Sans', sans-serif" }}>
            {doneSets}/{totalSets}
          </div>
          <div style={{ fontSize: "8px", color: "#7E7E7E", letterSpacing: "1px" }}>SERIES</div>
        </div>
      </div>

      <div style={{ height: "3px", background: "#1A1A1A", borderRadius: "2px", marginBottom: "14px", overflow: "hidden" }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: activeDay.color, borderRadius: "2px", transition: "width 0.3s ease" }} />
      </div>

      <div style={{
        background: "#111", borderLeft: `3px solid ${activeDay.color}`, borderRadius: "0 8px 8px 0",
        padding: "10px 14px", marginBottom: "14px", fontSize: "10px", color: "#8E8E8E", lineHeight: 1.6,
      }}>
        <span style={{ color: activeDay.color }}>CARGA PROGRESIVA — </span>
        Subí 2.5–5kg cuando completes todas las series en el rango alto 2 semanas seguidas.
      </div>

      {/* Nota de la sesión de hoy (esfuerzo + cómo te sentiste) */}
      <div style={{
        background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px",
        padding: "12px 14px", marginBottom: "14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "9px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#8E8E8E", textTransform: "uppercase" }}>
            NOTA DE HOY · {fmtDate(today)}
          </div>
          <button
            onClick={() => workout.saveNote(activeDay.id, today)}
            disabled={!dirty}
            style={{
              border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "9px",
              letterSpacing: "1px", fontWeight: "700", fontFamily: "'DM Mono', monospace",
              cursor: dirty ? "pointer" : "default",
              background: dirty ? activeDay.color : "#161616",
              color: dirty ? "#0A0A0A" : "#7E7E7E", transition: "all 0.15s",
            }}
          >
            {dirty ? "GUARDAR" : "✓"}
          </button>
        </div>
        <div style={{ fontSize: "8px", letterSpacing: "1px", color: "#7E7E7E", marginBottom: "6px", textTransform: "uppercase" }}>
          Esfuerzo percibido (RPE 1–10)
        </div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
            const active = draft.rpe === v;
            return (
              <button
                key={v}
                onClick={() => workout.setNoteDraft(activeDay.id, today, { rpe: active ? null : v })}
                style={{
                  width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer",
                  border: `1px solid ${active ? rpeColor(v) : "#222"}`,
                  background: active ? rpeColor(v) : "transparent",
                  color: active ? "#0A0A0A" : "#9C9C9C", fontSize: "11px", fontWeight: "700",
                  fontFamily: "'DM Mono', monospace", transition: "all 0.12s",
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
        <textarea
          placeholder="¿Cómo te sentiste? energía, dolores, sueño, ánimo…"
          value={draft.note || ""}
          onChange={(e) => workout.setNoteDraft(activeDay.id, today, { note: e.target.value })}
          rows={2}
          style={{
            width: "100%", boxSizing: "border-box", background: "#0A0A0A",
            border: "1px solid #1A1A1A", borderRadius: "8px", padding: "8px 10px",
            color: "#F0F0F0", fontSize: "12px", fontFamily: "'DM Mono', monospace",
            resize: "vertical", outline: "none", lineHeight: 1.5,
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        {activeDay.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={exIdx}
            ex={ex}
            exIdx={exIdx}
            activeDay={activeDay}
            workout={workout}
            completedCount={dayProgress[exIdx]}
          />
        ))}
      </div>
    </>
  );
}
