import { useState } from "react";
import { weekdays, colorPalette, nextAvailableColor } from "../lib/routine";

const cardStyle = { background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px" };
const labelStyle = { fontSize: "8px", letterSpacing: "2px", color: "#7E7E7E", textTransform: "uppercase", marginBottom: "5px" };
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#0A0A0A", border: "1px solid #1A1A1A",
  borderRadius: "7px", padding: "7px 9px", color: "#F0F0F0", fontSize: "12px",
  fontFamily: "'DM Mono', monospace", outline: "none",
};
const miniBtn = {
  border: "1px solid #222", background: "transparent", color: "#9C9C9C", borderRadius: "6px",
  width: "24px", height: "24px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

export default function RoutineEditorView({ routine, accentColor, onBack }) {
  const [draftDays, setDraftDays] = useState(() =>
    routine.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }))
  );
  const [draftMuscleColors, setDraftMuscleColors] = useState(() => ({ ...routine.muscleColors }));
  const [expandedDayId, setExpandedDayId] = useState(draftDays[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const markDirty = () => {
    setDirty(true);
    if (saveState !== "idle") setSaveState("idle");
  };

  const findDay = (id) => draftDays.find((d) => d.id === id);
  const orderIndex = (id) => weekdays.findIndex((w) => w.id === id);

  const toggleDayActive = (weekday) => {
    const existing = findDay(weekday.id);
    if (existing) {
      if (
        existing.exercises.length &&
        !window.confirm(
          `¿Quitar "${weekday.fullLabel}" de la rutina? Se pierden sus ${existing.exercises.length} ejercicios de la rutina (el historial ya registrado no se borra).`
        )
      ) {
        return;
      }
      setDraftDays((prev) => prev.filter((d) => d.id !== weekday.id));
      if (expandedDayId === weekday.id) setExpandedDayId(null);
    } else {
      const newDay = {
        id: weekday.id,
        label: weekday.label,
        fullLabel: weekday.fullLabel,
        type: "",
        focus: "",
        color: nextAvailableColor(draftDays.map((d) => d.color)),
        exercises: [],
      };
      setDraftDays((prev) => [...prev, newDay].sort((a, b) => orderIndex(a.id) - orderIndex(b.id)));
      setExpandedDayId(weekday.id);
    }
    markDirty();
  };

  const updateDay = (dayId, patch) => {
    setDraftDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));
    markDirty();
  };

  const updateExercise = (dayId, exIdx, patch) => {
    setDraftDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.map((e, i) => (i === exIdx ? { ...e, ...patch } : e)) } : d))
    );
    markDirty();
  };

  const addExercise = (dayId) => {
    setDraftDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: [...d.exercises, { muscle: "", name: "", sets: 3, reps: "10–12", note: "" }] } : d
      )
    );
    markDirty();
  };

  const removeExercise = (dayId, exIdx) => {
    setDraftDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) } : d)));
    markDirty();
  };

  const moveExercise = (dayId, exIdx, dir) => {
    setDraftDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const target = exIdx + dir;
        if (target < 0 || target >= d.exercises.length) return d;
        const exercises = [...d.exercises];
        [exercises[exIdx], exercises[target]] = [exercises[target], exercises[exIdx]];
        return { ...d, exercises };
      })
    );
    markDirty();
  };

  const handleSave = async () => {
    setSaveState("saving");
    // Se descartan ejercicios sin nombre; el día se conserva aunque quede vacío.
    // `sets` se normaliza a un entero ≥ 1 (por si quedó en blanco al editar).
    const cleanDays = draftDays.map((d) => ({
      ...d,
      exercises: d.exercises
        .filter((e) => e.name.trim() !== "")
        .map((e) => ({ ...e, name: e.name.trim(), sets: Math.max(1, Math.round(Number(e.sets)) || 1) })),
    }));
    const muscleColors = { ...draftMuscleColors };
    cleanDays.forEach((d) =>
      d.exercises.forEach((e) => {
        if (e.muscle && !muscleColors[e.muscle]) {
          muscleColors[e.muscle] = nextAvailableColor(Object.values(muscleColors));
        }
      })
    );
    try {
      await routine.saveRoutine(cleanDays, muscleColors);
      // Solo se agregan a la biblioteca los ejercicios que aún no estén (evita upserts de más).
      const known = new Set(routine.libraryExercises.map((le) => le.name));
      cleanDays.forEach((d) =>
        d.exercises.forEach((e) => {
          if (e.name && !known.has(e.name)) {
            known.add(e.name);
            routine.upsertLibraryExercise(e.name, e.muscle);
          }
        })
      );
      setDraftDays(cleanDays.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })));
      setDraftMuscleColors(muscleColors);
      setDirty(false);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      console.error("No se pudo guardar la rutina:", err);
      setSaveState("error");
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir sin guardar?")) return;
    onBack();
  };

  const libraryNames = [...new Set(routine.libraryExercises.map((e) => e.name))];
  const muscleGroups = Object.keys(draftMuscleColors);

  return (
    <div>
      <datalist id="gym-exercise-names">
        {libraryNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="gym-muscle-groups">
        {muscleGroups.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "10px" }}>
        <button
          onClick={handleBack}
          style={{ background: "transparent", border: "none", color: "#9C9C9C", fontSize: "11px", cursor: "pointer", fontFamily: "'DM Mono', monospace", padding: 0 }}
        >
          ← Volver
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || saveState === "saving"}
          style={{
            border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "10px",
            letterSpacing: "1px", fontWeight: "700", fontFamily: "'DM Mono', monospace",
            cursor: dirty ? "pointer" : "default",
            background: saveState === "saved" ? "#47FF88" : dirty ? accentColor : "#161616",
            color: dirty || saveState === "saved" ? "#0A0A0A" : "#7E7E7E", transition: "all 0.15s",
          }}
        >
          {saveState === "saving" ? "GUARDANDO..." : saveState === "saved" ? "✓ GUARDADO" : "GUARDAR CAMBIOS"}
        </button>
      </div>

      {saveState === "error" && (
        <div style={{ fontSize: "10px", color: "#FF6B6B", background: "#FF6B6B15", border: "1px solid #FF6B6B30", borderRadius: "8px", padding: "8px 10px", marginBottom: "14px", lineHeight: 1.5 }}>
          No se pudo guardar. Si es la primera vez, puede que falte crear la tabla <strong>routines</strong> en Supabase.
        </div>
      )}

      <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#7E7E7E", marginBottom: "14px" }}>EDITAR RUTINA</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {weekdays.map((weekday) => {
          const day = findDay(weekday.id);
          const isExpanded = expandedDayId === weekday.id;
          return (
            <div key={weekday.id} style={{ ...cardStyle, overflow: "hidden" }}>
              <div
                onClick={() => day && setExpandedDayId(isExpanded ? null : weekday.id)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", cursor: day ? "pointer" : "default" }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: day ? day.color : "#222", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", color: day ? "#F0F0F0" : "#5A5A5A" }}>
                    {weekday.fullLabel}
                  </div>
                  <div style={{ fontSize: "9px", color: "#7E7E7E", marginTop: "1px" }}>
                    {day ? (day.type || "Sin nombre") + ` · ${day.exercises.length} ejercicios` : "Descanso"}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDayActive(weekday);
                  }}
                  style={{
                    border: `1px solid ${day ? "#FF6B6B30" : accentColor + "40"}`, borderRadius: "7px",
                    background: "transparent", color: day ? "#FF6B6B" : accentColor,
                    fontSize: "9px", letterSpacing: "1px", fontWeight: "700", padding: "6px 10px",
                    cursor: "pointer", fontFamily: "'DM Mono', monospace", flexShrink: 0,
                  }}
                >
                  {day ? "QUITAR" : "+ ACTIVAR"}
                </button>
              </div>

              {day && isExpanded && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Nombre del día</div>
                      <input
                        style={inputStyle}
                        placeholder="ej. TORSO, PIERNA A..."
                        value={day.type}
                        onChange={(e) => updateDay(day.id, { type: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Enfoque</div>
                    <input
                      style={inputStyle}
                      placeholder="ej. Pecho + Espalda + Hombro"
                      value={day.focus}
                      onChange={(e) => updateDay(day.id, { focus: e.target.value })}
                    />
                  </div>
                  <div>
                    <div style={labelStyle}>Color</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {colorPalette.map((c) => (
                          <button
                            key={c}
                            onClick={() => updateDay(day.id, { color: c })}
                            style={{
                              width: "22px", height: "22px", borderRadius: "50%", background: c, cursor: "pointer",
                              border: c === day.color ? "2px solid #F0F0F0" : "2px solid transparent",
                            }}
                          />
                        ))}
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "#1A1A1A", margin: "2px 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} style={{ background: "#0A0A0A", border: "1px solid #161616", borderRadius: "9px", padding: "9px" }}>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            list="gym-muscle-groups"
                            placeholder="Grupo muscular"
                            value={ex.muscle}
                            onChange={(e) => updateExercise(day.id, exIdx, { muscle: e.target.value })}
                          />
                          <button onClick={() => moveExercise(day.id, exIdx, -1)} disabled={exIdx === 0} style={{ ...miniBtn, opacity: exIdx === 0 ? 0.3 : 1 }}>↑</button>
                          <button onClick={() => moveExercise(day.id, exIdx, 1)} disabled={exIdx === day.exercises.length - 1} style={{ ...miniBtn, opacity: exIdx === day.exercises.length - 1 ? 0.3 : 1 }}>↓</button>
                          <button onClick={() => removeExercise(day.id, exIdx)} style={{ ...miniBtn, color: "#FF6B6B" }}>×</button>
                        </div>
                        <input
                          style={{ ...inputStyle, marginBottom: "6px" }}
                          list="gym-exercise-names"
                          placeholder="Nombre del ejercicio"
                          value={ex.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const match = routine.libraryExercises.find((le) => le.name === name);
                            updateExercise(day.id, exIdx, { name, muscle: match && !ex.muscle ? match.muscle : ex.muscle });
                          }}
                        />
                        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                          <div style={{ width: "62px" }}>
                            <input
                              type="number"
                              min="1"
                              style={inputStyle}
                              placeholder="Series"
                              value={ex.sets}
                              onChange={(e) => updateExercise(day.id, exIdx, { sets: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                          </div>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            placeholder="Reps (ej. 10–12)"
                            value={ex.reps}
                            onChange={(e) => updateExercise(day.id, exIdx, { reps: e.target.value })}
                          />
                        </div>
                        <input
                          style={inputStyle}
                          placeholder="Nota (técnica, cadencia...)"
                          value={ex.note}
                          onChange={(e) => updateExercise(day.id, exIdx, { note: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addExercise(day.id)}
                    style={{
                      border: `1px dashed ${accentColor}50`, borderRadius: "9px", background: "transparent",
                      color: accentColor, fontSize: "10px", letterSpacing: "1px", fontWeight: "700",
                      padding: "9px", cursor: "pointer", fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    + AGREGAR EJERCICIO
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
