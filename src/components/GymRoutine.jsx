import { useState } from "react";
import { days } from "../data/routine";
import useWorkoutData from "../hooks/useWorkoutData";
import BottomNav from "./BottomNav";
import RutinaView from "./RutinaView";
import ProgresoView from "./ProgresoView";
import VolumenView from "./VolumenView";
import RecordsView from "./RecordsView";
import PerfilView from "./PerfilView";

export default function GymRoutine({ session }) {
  const workout = useWorkoutData(session);

  const [activeDay, setActiveDay] = useState(days[0]);
  const [view, setView] = useState("rutina"); // "rutina" | "progreso" | "volumen" | "records" | "perfil"

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#F0F0F0" }}>
      {/* Header */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #1A1A1A" }}>
        <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#8E8E8E", textTransform: "uppercase", marginBottom: "6px" }}>
          Torso · Pierna · Empuje · Tirón
        </div>
        <h1 style={{
          fontSize: "clamp(24px, 6vw, 42px)",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: "800",
          letterSpacing: "-2px",
          margin: 0,
          lineHeight: 1,
        }}>
          HIPERTROFIA<br />
          <span style={{ color: activeDay.color }}>5 DÍAS</span>
        </h1>
      </div>

      <div style={{ padding: "20px 20px calc(96px + env(safe-area-inset-bottom))" }}>
        {view === "progreso" ? (
          <ProgresoView workout={workout} activeDay={activeDay} />
        ) : view === "volumen" ? (
          <VolumenView />
        ) : view === "records" ? (
          <RecordsView workout={workout} activeDay={activeDay} />
        ) : view === "perfil" ? (
          <PerfilView userEmail={workout.userEmail} syncState={workout.syncState} logout={workout.logout} activeDay={activeDay} />
        ) : (
          <RutinaView
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            workout={workout}
          />
        )}
      </div>

      <BottomNav view={view} setView={setView} activeDay={activeDay} />
    </div>
  );
}
