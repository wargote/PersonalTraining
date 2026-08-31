import { useState, useEffect } from "react";
import useWorkoutData from "../hooks/useWorkoutData";
import useRoutine from "../hooks/useRoutine";
import BottomNav from "./BottomNav";
import RutinaView from "./RutinaView";
import ProgresoView from "./ProgresoView";
import VolumenView from "./VolumenView";
import RecordsView from "./RecordsView";
import PerfilView from "./PerfilView";
import RoutineEditorView from "./RoutineEditorView";

export default function GymRoutine({ session }) {
  const routine = useRoutine(session);
  const workout = useWorkoutData(session, routine.days);

  const [activeDayId, setActiveDayId] = useState(routine.days[0]?.id);
  const [view, setView] = useState("rutina"); // "rutina" | "progreso" | "volumen" | "records" | "perfil" | "editor"

  // Si la rutina cambia (llega de Supabase, o se edita), conservamos el día activo
  // si sigue existiendo; si no, caemos al primero disponible.
  useEffect(() => {
    if (!routine.days.some((d) => d.id === activeDayId)) {
      setActiveDayId(routine.days[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.days]);

  const activeDay = routine.days.find((d) => d.id === activeDayId) || routine.days[0];

  if (!activeDay) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#8E8E8E", fontFamily: "'DM Mono', monospace", fontSize: "12px",
      }}>
        No tienes días activos en tu rutina. Andá a Perfil → Editar rutina para agregar uno.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#F0F0F0" }}>
      {/* Header */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #1A1A1A" }}>
        <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#8E8E8E", textTransform: "uppercase", marginBottom: "6px" }}>
          {routine.days.map((d) => d.type || d.label).join(" · ")}
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 6vw, 42px)",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: "800",
          letterSpacing: "-2px",
          margin: 0,
          lineHeight: 1,
        }}>
          MI RUTINA<br />
          <span style={{ color: activeDay.color }}>{routine.days.length} DÍAS</span>
        </h1>
      </div>

      <div key={view} className="view-transition" style={{ padding: "20px 20px calc(96px + env(safe-area-inset-bottom))" }}>
        {view === "progreso" ? (
          <ProgresoView workout={workout} activeDay={activeDay} />
        ) : view === "volumen" ? (
          <VolumenView days={routine.days} muscleColors={routine.muscleColors} />
        ) : view === "records" ? (
          <RecordsView workout={workout} activeDay={activeDay} days={routine.days} />
        ) : view === "perfil" ? (
          <PerfilView
            userEmail={workout.userEmail}
            syncState={workout.syncState}
            logout={workout.logout}
            activeDay={activeDay}
            onEditRoutine={() => setView("editor")}
          />
        ) : view === "editor" ? (
          <RoutineEditorView routine={routine} accentColor={activeDay.color} onBack={() => setView("perfil")} />
        ) : (
          <RutinaView
            activeDay={activeDay}
            setActiveDay={(d) => setActiveDayId(d.id)}
            workout={workout}
            days={routine.days}
            muscleColors={routine.muscleColors}
          />
        )}
      </div>

      <BottomNav view={view} setView={setView} activeDay={activeDay} />
    </div>
  );
}
