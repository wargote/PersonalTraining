import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const days = [
  {
    id: "lunes",
    label: "LUN",
    fullLabel: "Lunes",
    type: "TORSO",
    focus: "Pecho + Espalda + Hombro + Brazos",
    color: "#E8FF47",
    exercises: [
      { muscle: "Pecho", name: "Press inclinado con mancuernas", sets: 4, reps: "10–12", note: "45°, codos a 75°, estiramiento completo en el fondo" },
      { muscle: "Pecho", name: "Aperturas en máquina (pec deck)", sets: 3, reps: "12–15", note: "Contracción 1 seg en el pico, no abrir demasiado" },
      { muscle: "Espalda", name: "Jalón al pecho agarre prono ancho", sets: 4, reps: "10–12", note: "Tirar hacia clavícula, codos hacia cadera" },
      { muscle: "Espalda", name: "Remo en T con apoyo pecho", sets: 3, reps: "10–12", note: "Agarre neutro, codos pegados al cuerpo" },
      { muscle: "Hombro", name: "Press militar con mancuernas sentado", sets: 3, reps: "10–12", note: "No bloquear codos arriba, bajar a 90°" },
      { muscle: "Hombro", name: "Elevaciones laterales con mancuernas", sets: 3, reps: "12–15", note: "Codo ligeramente doblado, subir a altura de hombro" },
      { muscle: "Bíceps", name: "Curl predicador con mancuerna", sets: 3, reps: "10–12", note: "Codo fijo en el apoyo, estiramiento completo abajo" },
      { muscle: "Tríceps", name: "Extensión en polea con cuerda (pushdown)", sets: 3, reps: "12–15", note: "Abrir la cuerda al final para mayor contracción" },
    ],
  },
  {
    id: "martes",
    label: "MAR",
    fullLabel: "Martes",
    type: "PIERNA A",
    focus: "Cuádriceps + Femoral + Glúteo + Pantorrilla",
    color: "#FF6B6B",
    exercises: [
      { muscle: "Cuádriceps", name: "Sentadilla en hack machine", sets: 4, reps: "10–12", note: "Pies al frente, rodillas siguen los pies, rango completo" },
      { muscle: "Cuádriceps", name: "Extensión de cuádriceps en máquina", sets: 3, reps: "12–15", note: "Aislamiento, contracción 1 seg arriba" },
      { muscle: "Femoral", name: "Femoral sentado en máquina", sets: 4, reps: "10–12", note: "Estiramiento completo, no usar inercia" },
      { muscle: "Glúteo", name: "Hip Thrust en máquina o barra", sets: 4, reps: "10–12", note: "Barra en cadera con almohadilla, pelvis neutra arriba" },
      { muscle: "Glúteo/Femoral", name: "Búlgara con mancuernas", sets: 3, reps: "10 c/u", note: "Pie trasero elevado, torso ligeramente inclinado hacia adelante" },
      { muscle: "Pantorrilla", name: "Pantorrilla de pie en máquina", sets: 4, reps: "15–20", note: "Rango completo, pausa 1 seg abajo estirando" },
    ],
  },
  {
    id: "jueves",
    label: "JUE",
    fullLabel: "Jueves",
    type: "EMPUJE",
    focus: "Pecho + Hombro + Tríceps",
    color: "#47C4FF",
    exercises: [
      { muscle: "Pecho", name: "Press plano con mancuernas", sets: 4, reps: "10–12", note: "Variante al inclinado, énfasis en pecho medio" },
      { muscle: "Pecho", name: "Crossover en polea alta (cable)", sets: 3, reps: "12–15", note: "Polea alta hacia abajo, contracción máxima en el cruce" },
      { muscle: "Hombro", name: "Press Arnold con mancuernas", sets: 4, reps: "10–12", note: "Rotación completa, activa las 3 cabezas del deltoides" },
      { muscle: "Hombro", name: "Elevaciones laterales en cable", sets: 3, reps: "12–15", note: "Tensión constante en todo el rango, mejor que mancuerna" },
      { muscle: "Hombro", name: "Face pull en polea con cuerda", sets: 3, reps: "15", note: "Polea a altura de cara, codos arriba, rotación externa al final" },
      { muscle: "Tríceps", name: "Extensión por encima de la cabeza con mancuerna", sets: 3, reps: "12–15", note: "Cabeza larga, codos juntos arriba, estiramiento máximo" },
      { muscle: "Tríceps", name: "Press francés con barra EZ", sets: 3, reps: "10–12", note: "Codos fijos apuntando al techo, bajar detrás de la cabeza" },
    ],
  },
  {
    id: "viernes",
    label: "VIE",
    fullLabel: "Viernes",
    type: "TIRÓN",
    focus: "Espalda + Bíceps",
    color: "#FF47C4",
    exercises: [
      { muscle: "Espalda", name: "Jalón al pecho agarre neutro cerrado", sets: 4, reps: "10–12", note: "Barra V, mayor activación bíceps y espalda baja" },
      { muscle: "Espalda", name: "Remo en polea sentado agarre ancho", sets: 4, reps: "10–12", note: "Codos hacia afuera, énfasis espalda alta y romboides" },
      { muscle: "Espalda", name: "Pull over en polea o con mancuerna", sets: 3, reps: "12–15", note: "Estiramiento del dorsal, codo ligeramente doblado" },
      { muscle: "Bíceps", name: "Curl alterno con mancuernas", sets: 4, reps: "10–12", note: "Supinación completa en la subida, no balancear" },
      { muscle: "Bíceps", name: "Curl martillo con mancuernas", sets: 3, reps: "12", note: "Agarre neutro, activa braquial y braquiorradial" },
      { muscle: "Bíceps", name: "Curl en polea baja (cable)", sets: 3, reps: "12–15", note: "Tensión constante, énfasis en el pico de contracción" },
    ],
  },
  {
    id: "sabado",
    label: "SÁB",
    fullLabel: "Sábado",
    type: "PIERNA B",
    focus: "Glúteo + Femoral + Cuádriceps + Pantorrilla",
    color: "#47FFB4",
    exercises: [
      { muscle: "Glúteo/Femoral", name: "Peso muerto rumano con mancuernas", sets: 4, reps: "10–12", note: "Espalda neutra, bajar hasta tensión en femoral, no al suelo" },
      { muscle: "Femoral", name: "Curl femoral tumbado en máquina", sets: 4, reps: "12–15", note: "Variante al sentado, diferente ángulo de cadera" },
      { muscle: "Glúteo", name: "Hip Thrust unilateral", sets: 3, reps: "12 c/u", note: "Más activación glúteo que bilateral, controlar la pelvis" },
      { muscle: "Cuádriceps", name: "Prensa de piernas 45°", sets: 4, reps: "10–12", note: "Pies a ancho de hombros, no bloquear rodillas arriba" },
      { muscle: "Cuádriceps", name: "Extensión de cuádriceps en máquina", sets: 3, reps: "12–15", note: "Aislamiento final, diferente pie del martes si podés" },
      { muscle: "Pantorrilla", name: "Pantorrilla sentado en máquina", sets: 4, reps: "15–20", note: "Sóleo (rodilla doblada), ángulo distinto al de pie" },
    ],
  },
];

const muscleColors = {
  Pecho: "#FF9F47",
  Espalda: "#47C4FF",
  Cuádriceps: "#FF6B6B",
  Femoral: "#FF47C4",
  Glúteo: "#C447FF",
  "Glúteo/Femoral": "#D147FF",
  Tríceps: "#E8FF47",
  Bíceps: "#47FFB4",
  Hombro: "#47FFE8",
  Pantorrilla: "#FFD447",
};

const allDayOrder = [
  { label: "LUN", dayId: "lunes" },
  { label: "MAR", dayId: "martes" },
  { label: "MIÉ", dayId: null },
  { label: "JUE", dayId: "jueves" },
  { label: "VIE", dayId: "viernes" },
  { label: "SÁB", dayId: "sabado" },
  { label: "DOM", dayId: null },
];

const volumeSummary = [
  { m: "Pecho", s: 14, days: "Lun + Jue" },
  { m: "Espalda", s: 14, days: "Lun + Vie" },
  { m: "Hombro", s: 16, days: "Lun + Jue" },
  { m: "Bíceps", s: 13, days: "Lun + Vie" },
  { m: "Tríceps", s: 9, days: "Lun + Jue" },
  { m: "Cuádriceps", s: 14, days: "Mar + Sáb" },
  { m: "Femoral", s: 14, days: "Mar + Sáb" },
  { m: "Glúteo", s: 14, days: "Mar + Sáb" },
  { m: "Pantorrilla", s: 8, days: "Mar + Sáb" },
];

// --- Helpers de conversión entre el formato local y las filas de Supabase ---

// "lunes::Press inclinado" -> ["lunes", "Press inclinado"]
const splitKey = (key) => {
  const idx = key.indexOf("::");
  if (idx === -1) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 2)];
};

// reps puede venir como array de strings/números o como string suelto -> int[]
const repsToIntArray = (reps) => {
  if (reps == null) return [];
  const arr = Array.isArray(reps) ? reps : [reps];
  return arr
    .map((r) => parseInt(r, 10))
    .filter((n) => !Number.isNaN(n));
};

// localStorage (gym-weight-history) -> filas listas para upsert en exercise_logs
const localCacheToRows = (userId) => {
  let cache;
  try {
    cache = JSON.parse(localStorage.getItem("gym-weight-history") || "{}");
  } catch {
    return [];
  }
  const rows = [];
  Object.entries(cache).forEach(([key, entries]) => {
    const [dayId, exerciseName] = splitKey(key);
    if (!dayId || !exerciseName || !Array.isArray(entries)) return;
    entries.forEach((e) => {
      const weight = parseFloat(e.weight);
      if (!e.date || Number.isNaN(weight)) return;
      rows.push({
        user_id: userId,
        day_id: dayId,
        exercise_name: exerciseName,
        log_date: e.date,
        weight,
        reps: repsToIntArray(e.reps),
      });
    });
  });
  return rows;
};

// filas de exercise_logs -> mapa { "dayId::ejercicio": [{ date, weight, reps }, ...] }
const rowsToHistory = (rows) => {
  const map = {};
  rows.forEach((row) => {
    const key = `${row.day_id}::${row.exercise_name}`;
    if (!map[key]) map[key] = [];
    const entry = { date: row.log_date, weight: String(row.weight) };
    if (Array.isArray(row.reps) && row.reps.length) {
      entry.reps = row.reps.map(String);
    }
    map[key].push(entry);
  });
  // Cada lista ordenada de más reciente a más antigua (la query ya viene desc, pero aseguramos).
  Object.values(map).forEach((list) =>
    list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  );
  return map;
};

export default function GymRoutine({ session }) {
  const userId = session.user.id;
  const userEmail = session.user.email;

  const [activeDay, setActiveDay] = useState(days[0]);
  const [completedSets, setCompletedSets] = useState({});
  const [view, setView] = useState("rutina"); // "rutina" | "volumen" | "records"
  // Historial de peso por ejercicio: { "dayId::ejercicio": [{ date, weight, reps }, ...] } (más reciente primero)
  // Se inicializa desde el caché local para pintar al instante; luego se reemplaza con lo de Supabase.
  const [weightHistory, setWeightHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem("gym-weight-history");
      if (savedHistory) return JSON.parse(savedHistory);
      // Migración del formato antiguo (un solo valor por ejercicio)
      const oldWeights = localStorage.getItem("gym-weights");
      if (oldWeights) {
        const parsed = JSON.parse(oldWeights);
        const migrated = {};
        const today = new Date().toISOString().slice(0, 10);
        Object.entries(parsed).forEach(([key, value]) => {
          if (value !== "" && value != null) {
            migrated[key] = [{ date: today, weight: String(value) }];
          }
        });
        return migrated;
      }
      return {};
    } catch {
      return {};
    }
  });

  // Valores que se están escribiendo antes de guardarlos
  const [drafts, setDrafts] = useState({});       // peso
  const [repDrafts, setRepDrafts] = useState({}); // repeticiones logradas
  // Qué ejercicios tienen el historial desplegado
  const [openHistory, setOpenHistory] = useState({});
  const [syncState, setSyncState] = useState("loading"); // loading | ready | error

  // Caché offline: cada cambio del historial se guarda también en localStorage.
  useEffect(() => {
    localStorage.setItem("gym-weight-history", JSON.stringify(weightHistory));
  }, [weightHistory]);

  // Al entrar: migrar lo que haya en localStorage (una sola vez) y cargar desde Supabase.
  useEffect(() => {
    let cancelled = false;

    const migrateThenLoad = async () => {
      try {
        // 1) Migración única de los datos locales hacia la BD.
        const migrationFlag = `gym-migrated-v1-${userId}`;
        if (!localStorage.getItem(migrationFlag)) {
          const rows = localCacheToRows(userId);
          if (rows.length) {
            const { error } = await supabase
              .from("exercise_logs")
              .upsert(rows, { onConflict: "user_id,day_id,exercise_name,log_date" });
            if (error) throw error;
          }
          localStorage.setItem(migrationFlag, "1");
        }

        // 2) Carga de todo el historial del usuario desde la BD.
        const { data, error } = await supabase
          .from("exercise_logs")
          .select("day_id, exercise_name, log_date, weight, reps")
          .order("log_date", { ascending: false });
        if (error) throw error;

        if (!cancelled) {
          setWeightHistory(rowsToHistory(data || []));
          setSyncState("ready");
        }
      } catch (err) {
        console.error("Error sincronizando con Supabase:", err);
        if (!cancelled) setSyncState("error");
      }
    };

    migrateThenLoad();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const getWeightKey = (dayId, exerciseName) => `${dayId}::${exerciseName}`;
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const fmtDate = (iso) => {
    const [, m, d] = iso.split("-").map(Number);
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return `${d} ${months[m - 1]}`;
  };

  const getHistory = (dayId, name) => weightHistory[getWeightKey(dayId, name)] || [];
  const getLastEntry = (dayId, name) => getHistory(dayId, name)[0] || null;

  const getDraft = (dayId, name) => {
    const key = getWeightKey(dayId, name);
    if (drafts[key] !== undefined) return drafts[key];
    const last = getLastEntry(dayId, name);
    return last ? last.weight : "";
  };

  const setDraft = (dayId, name, value) => {
    setDrafts((prev) => ({ ...prev, [getWeightKey(dayId, name)]: value }));
  };

  // Reps siempre como arreglo (una por serie). Tolera el formato viejo (string).
  const normalizeReps = (entry) => {
    if (!entry) return [];
    const r = entry.reps;
    if (Array.isArray(r)) return r.map((x) => (x == null ? "" : String(x)));
    if (r == null || r === "") return [];
    return [String(r)];
  };

  const getRepDraft = (dayId, name, setIdx) => {
    const key = getWeightKey(dayId, name);
    const arr = repDrafts[key];
    if (arr && arr[setIdx] !== undefined) return arr[setIdx];
    const lastReps = normalizeReps(getLastEntry(dayId, name));
    return lastReps[setIdx] != null ? lastReps[setIdx] : "";
  };

  const setRepDraft = (dayId, name, setIdx, value) => {
    const key = getWeightKey(dayId, name);
    setRepDrafts((prev) => {
      const arr = prev[key] ? [...prev[key]] : [];
      arr[setIdx] = value;
      return { ...prev, [key]: arr };
    });
  };

  // Diferencia entre la sesión más reciente y la anterior
  const getDelta = (history) => {
    if (history.length < 2) return null;
    const cur = parseFloat(history[0].weight);
    const prev = parseFloat(history[1].weight);
    if (isNaN(cur) || isNaN(prev)) return null;
    return Math.round((cur - prev) * 100) / 100;
  };

  // Reps máximas logradas en una sesión (mejor serie)
  const maxReps = (entry) => {
    const nums = normalizeReps(entry).map((x) => parseFloat(x)).filter((n) => !isNaN(n));
    return nums.length ? Math.max(...nums) : NaN;
  };

  // Récord personal: mayor peso registrado (a igual peso, más reps en la mejor serie)
  const getPR = (history) => {
    let best = null;
    history.forEach((e) => {
      const w = parseFloat(e.weight);
      if (isNaN(w)) return;
      const r = maxReps(e);
      if (
        best === null ||
        w > best.w ||
        (w === best.w && !isNaN(r) && (isNaN(best.r) || r > best.r))
      ) {
        best = { w, r, weight: e.weight, reps: normalizeReps(e), date: e.date };
      }
    });
    return best;
  };

  const saveWeight = (dayId, name, numSets) => {
    const key = getWeightKey(dayId, name);
    const value = String(getDraft(dayId, name)).trim();
    if (value === "") return;
    const reps = [];
    for (let i = 0; i < numSets; i++) reps.push(String(getRepDraft(dayId, name, i)).trim());
    while (reps.length && reps[reps.length - 1] === "") reps.pop(); // quitar series vacías al final
    const today = todayStr();

    // Actualización optimista del estado local (se ve al instante).
    setWeightHistory((prev) => {
      const list = prev[key] ? [...prev[key]] : [];
      const entry = { date: today, weight: value };
      if (reps.length) entry.reps = reps;
      const idx = list.findIndex((e) => e.date === today);
      if (idx >= 0) {
        list[idx] = entry; // ya registraste hoy → actualizar
      } else {
        list.unshift(entry); // nueva sesión
      }
      return { ...prev, [key]: list };
    });

    // Persistir en Supabase (upsert por la clave única usuario+día+ejercicio+fecha).
    supabase
      .from("exercise_logs")
      .upsert(
        {
          user_id: userId,
          day_id: dayId,
          exercise_name: name,
          log_date: today,
          weight: parseFloat(value),
          reps: repsToIntArray(reps),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,day_id,exercise_name,log_date" }
      )
      .then(({ error }) => {
        if (error) console.error("No se pudo guardar en Supabase:", error);
      });

    // Limpiar los drafts para que vuelvan a reflejar lo guardado
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setRepDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const deleteEntry = (dayId, name, date) => {
    const key = getWeightKey(dayId, name);
    setWeightHistory((prev) => {
      const list = (prev[key] || []).filter((e) => e.date !== date);
      const next = { ...prev };
      if (list.length) next[key] = list;
      else delete next[key];
      return next;
    });

    // Borrar también en Supabase.
    supabase
      .from("exercise_logs")
      .delete()
      .match({ user_id: userId, day_id: dayId, exercise_name: name, log_date: date })
      .then(({ error }) => {
        if (error) console.error("No se pudo borrar en Supabase:", error);
      });
  };

  const toggleHistory = (dayId, name) => {
    const key = getWeightKey(dayId, name);
    setOpenHistory((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSet = (exIdx, setIdx) => {
    const key = `${activeDay.id}-${exIdx}-${setIdx}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSetDone = (exIdx, setIdx) => completedSets[`${activeDay.id}-${exIdx}-${setIdx}`];

  const dayProgress = activeDay.exercises.map((ex, exIdx) =>
    Array.from({ length: ex.sets }, (_, i) => isSetDone(exIdx, i)).filter(Boolean).length
  );
  const totalSets = activeDay.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = dayProgress.reduce((a, b) => a + b, 0);
  const progressPct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#F0F0F0" }}>
      {/* Header */}
      <div style={{ padding: "28px 20px 0", borderBottom: "1px solid #1A1A1A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#444", textTransform: "uppercase", marginBottom: "6px" }}>
              Torso · Pierna · Empuje · Tirón
            </div>
            <h1 style={{
              fontSize: "clamp(24px, 6vw, 42px)",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: "800",
              letterSpacing: "-2px",
              margin: "0 0 20px",
              lineHeight: 1,
            }}>
              HIPERTROFIA<br />
              <span style={{ color: activeDay.color }}>5 DÍAS</span>
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
            {[
              { id: "rutina", label: "RUTINA" },
              { id: "volumen", label: "VOLUMEN" },
              { id: "records", label: "PRs" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  background: view === v.id ? activeDay.color : "transparent",
                  border: `1px solid ${view === v.id ? activeDay.color : "#222"}`,
                  borderRadius: "8px",
                  color: view === v.id ? "#0A0A0A" : "#555",
                  fontSize: "9px",
                  fontWeight: view === v.id ? "700" : "400",
                  letterSpacing: "2px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  transition: "all 0.15s",
                }}
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={logout}
              title={`Conectado como ${userEmail} — toca para salir`}
              style={{
                background: "transparent",
                border: "1px solid #222",
                borderRadius: "8px",
                color: "#555",
                fontSize: "9px",
                letterSpacing: "2px",
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                marginTop: "2px",
              }}
            >
              {syncState === "loading" ? "···" : syncState === "error" ? "⚠ OFFLINE" : "SALIR"}
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: "3px", overflowX: "auto", scrollbarWidth: "none" }}>
          {allDayOrder.map(({ label, dayId }) => {
            const day = days.find((d) => d.id === dayId);
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
                  color: isActive ? "#0A0A0A" : isRest ? "#222" : "#555",
                  border: "none",
                  borderRadius: "8px 8px 0 0",
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
                <div style={{ fontSize: "8px", marginTop: "2px", color: isActive ? "#0A0A0A77" : isRest ? "#1A1A1A" : "#2A2A2A" }}>
                  {isRest ? "REST" : day.type}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 20px 48px" }}>
        {view === "volumen" ? (
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#333", marginBottom: "16px" }}>SERIES SEMANALES POR MÚSCULO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {volumeSummary.map(({ m, s, days: d }) => (
                <div key={m} style={{
                  background: "#111", border: "1px solid #1A1A1A", borderRadius: "10px",
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: muscleColors[m] || "#888", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", color: "#DDD", fontFamily: "'DM Sans', sans-serif", fontWeight: "600" }}>{m}</div>
                    <div style={{ fontSize: "10px", color: "#333", marginTop: "2px" }}>{d}</div>
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
        ) : view === "records" ? (
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#333", marginBottom: "16px" }}>RÉCORDS PERSONALES POR EJERCICIO</div>
            {(() => {
              const dayGroups = days.map((day) => {
                const rows = day.exercises
                  .map((ex) => {
                    const hist = getHistory(day.id, ex.name);
                    const pr = getPR(hist);
                    return pr ? { ex, pr, sessions: hist.length } : null;
                  })
                  .filter(Boolean);
                return { day, rows };
              }).filter((g) => g.rows.length > 0);

              if (dayGroups.length === 0) {
                return (
                  <div style={{ fontSize: "11px", color: "#444", lineHeight: 1.6, background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px", padding: "16px" }}>
                    Aún no tienes récords. Registra el peso y las reps de un ejercicio en la pestaña <span style={{ color: activeDay.color }}>RUTINA</span> y aparecerán aquí.
                  </div>
                );
              }

              return (
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
                              <div style={{ fontSize: "9px", color: "#333", marginTop: "2px", letterSpacing: "1px" }}>
                                {fmtDate(pr.date)} · {sessions} {sessions === 1 ? "sesión" : "sesiones"}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFD447", fontFamily: "'DM Sans', sans-serif" }}>
                                {pr.weight} kg
                              </div>
                              {pr.reps.length > 0 && (
                                <div style={{ fontSize: "9px", color: "#555", marginTop: "1px" }}>
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
              );
            })()}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color: activeDay.color, textTransform: "uppercase", marginBottom: "4px" }}>
                  {activeDay.type} — {activeDay.fullLabel}
                </div>
                <div style={{ fontSize: "12px", color: "#555" }}>{activeDay.focus}</div>
              </div>
              <div style={{
                background: activeDay.color + "15", border: `1px solid ${activeDay.color}30`,
                borderRadius: "8px", padding: "8px 12px", textAlign: "center", minWidth: "52px",
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: activeDay.color, fontFamily: "'DM Sans', sans-serif" }}>
                  {doneSets}/{totalSets}
                </div>
                <div style={{ fontSize: "8px", color: "#333", letterSpacing: "1px" }}>SERIES</div>
              </div>
            </div>

            <div style={{ height: "3px", background: "#1A1A1A", borderRadius: "2px", marginBottom: "14px", overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: activeDay.color, borderRadius: "2px", transition: "width 0.3s ease" }} />
            </div>

            <div style={{
              background: "#111", borderLeft: `3px solid ${activeDay.color}`, borderRadius: "0 8px 8px 0",
              padding: "10px 14px", marginBottom: "14px", fontSize: "10px", color: "#444", lineHeight: 1.6,
            }}>
              <span style={{ color: activeDay.color }}>CARGA PROGRESIVA — </span>
              Subí 2.5–5kg cuando completes todas las series en el rango alto 2 semanas seguidas.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {activeDay.exercises.map((ex, exIdx) => {
                const completedCount = dayProgress[exIdx];
                const allDone = completedCount === ex.sets;
                return (
                  <div key={exIdx} style={{
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
                        <div style={{ fontSize: "10px", color: "#333", lineHeight: 1.4 }}>{ex.note}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: activeDay.color, fontFamily: "'DM Sans', sans-serif" }}>
                          {ex.sets}×{ex.reps}
                        </div>
                        <div style={{ fontSize: "9px", color: "#2A2A2A", marginTop: "2px" }}>{completedCount}/{ex.sets}</div>
                      </div>
                    </div>
                    {/* Peso + historial */}
                    {(() => {
                      const history = getHistory(activeDay.id, ex.name);
                      const last = history[0] || null;
                      const delta = getDelta(history);
                      const pr = getPR(history);
                      const draft = getDraft(activeDay.id, ex.name);
                      const savedToday = last && last.date === todayStr();
                      const lastReps = normalizeReps(last);
                      let repsChanged = false;
                      for (let i = 0; i < ex.sets; i++) {
                        if (String(getRepDraft(activeDay.id, ex.name, i)).trim() !== String(lastReps[i] ?? "").trim()) {
                          repsChanged = true;
                          break;
                        }
                      }
                      const dirty = last
                        ? String(draft).trim() !== String(last.weight) || repsChanged
                        : String(draft).trim() !== "";
                      const isOpen = openHistory[getWeightKey(activeDay.id, ex.name)];
                      return (
                        <div style={{ marginBottom: "10px" }}>
                          {/* Referencia: último peso registrado */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            marginBottom: "6px", fontSize: "9px", letterSpacing: "1px",
                          }}>
                            {last ? (
                              <>
                                <span style={{ color: "#333", textTransform: "uppercase" }}>
                                  {savedToday ? "HOY" : "ÚLTIMO"}
                                </span>
                                <span style={{ color: "#888", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", fontSize: "11px" }}>
                                  {last.weight} kg{lastReps.length ? ` · ${lastReps.join("/")}` : ""}
                                </span>
                                <span style={{ color: "#2A2A2A" }}>· {fmtDate(last.date)}</span>
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
                              <span style={{ color: "#2A2A2A", textTransform: "uppercase" }}>Sin registro previo</span>
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
                                onClick={() => toggleHistory(activeDay.id, ex.name)}
                                style={{
                                  marginLeft: "auto", background: "transparent", border: "none",
                                  color: "#444", fontSize: "9px", letterSpacing: "1px", cursor: "pointer",
                                  fontFamily: "'DM Mono', monospace", padding: 0,
                                }}
                              >
                                {isOpen ? "OCULTAR" : `HISTORIAL (${history.length})`}
                              </button>
                            )}
                          </div>

                          {/* Input + guardar */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 10px", background: "#0A0A0A",
                            borderRadius: "8px", border: "1px solid #1A1A1A",
                          }}>
                            <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#333", textTransform: "uppercase", flexShrink: 0 }}>PESO</div>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="—"
                              value={draft}
                              onChange={(e) => setDraft(activeDay.id, ex.name, e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { saveWeight(activeDay.id, ex.name, ex.sets); e.target.blur(); } }}
                              style={{
                                width: "44px", background: "transparent", border: "none", outline: "none",
                                color: activeDay.color, fontSize: "14px", fontWeight: "700",
                                fontFamily: "'DM Sans', sans-serif", textAlign: "center",
                              }}
                            />
                            <div style={{ fontSize: "10px", color: "#333", flexShrink: 0 }}>kg</div>
                            <div style={{ fontSize: "8px", color: "#2A2A2A", letterSpacing: "1px", flexShrink: 0 }}>· mismo peso todas las series</div>
                            <div style={{ flex: 1 }} />
                            <button
                              onClick={() => saveWeight(activeDay.id, ex.name, ex.sets)}
                              disabled={!dirty}
                              style={{
                                flexShrink: 0, border: "none", borderRadius: "6px",
                                padding: "6px 10px", fontSize: "9px", letterSpacing: "1px",
                                fontWeight: "700", fontFamily: "'DM Mono', monospace",
                                cursor: dirty ? "pointer" : "default",
                                background: dirty ? activeDay.color : "#161616",
                                color: dirty ? "#0A0A0A" : "#333",
                                transition: "all 0.15s",
                              }}
                            >
                              {dirty ? "GUARDAR" : "✓"}
                            </button>
                          </div>

                          {/* Lista de historial */}
                          {isOpen && (
                            <div style={{
                              marginTop: "6px", padding: "6px 10px",
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
                                    <div style={{ fontSize: "9px", color: "#333", marginBottom: "4px", lineHeight: 1.5 }}>
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
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#333", marginTop: "2px" }}>
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
                                    fontSize: "10px", color: "#666",
                                  }}>
                                    <span style={{ color: "#444", minWidth: "44px" }}>{fmtDate(entry.date)}</span>
                                    <span style={{ color: "#AAA", fontWeight: "700", fontFamily: "'DM Sans', sans-serif" }}>
                                      {entry.weight} kg{normalizeReps(entry).length ? ` · ${normalizeReps(entry).join("/")}` : ""}
                                    </span>
                                    {isPR && <span style={{ color: "#FFD447", fontSize: "9px" }} title="Récord personal">★</span>}
                                    {d !== null && d !== 0 && (
                                      <span style={{ color: d > 0 ? "#47FF88" : "#FF6B6B", fontSize: "9px" }}>
                                        {d > 0 ? "+" : ""}{d}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => deleteEntry(activeDay.id, ex.name, entry.date)}
                                      style={{
                                        marginLeft: "auto", background: "transparent", border: "none",
                                        color: "#333", fontSize: "12px", cursor: "pointer", padding: "0 2px",
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
                    })()}
                    {/* Series: reps logradas por serie (mismo peso) + completado */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {Array.from({ length: ex.sets }, (_, setIdx) => {
                        const done = isSetDone(exIdx, setIdx);
                        const prevReps = normalizeReps(getLastEntry(activeDay.id, ex.name))[setIdx];
                        return (
                          <div
                            key={setIdx}
                            style={{
                              display: "flex", alignItems: "center", gap: "5px",
                              padding: "4px 6px 4px 8px", borderRadius: "8px",
                              border: `1px solid ${done ? activeDay.color : "#222"}`,
                              background: done ? activeDay.color + "12" : "#0A0A0A",
                              transition: "all 0.12s",
                            }}
                          >
                            <span style={{ fontSize: "8px", color: "#444", fontFamily: "'DM Mono', monospace", letterSpacing: "1px" }}>
                              S{setIdx + 1}
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={prevReps != null && prevReps !== "" ? prevReps : "reps"}
                              value={getRepDraft(activeDay.id, ex.name, setIdx)}
                              onChange={(e) => setRepDraft(activeDay.id, ex.name, setIdx, e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { saveWeight(activeDay.id, ex.name, ex.sets); e.target.blur(); } }}
                              style={{
                                width: "32px", background: "transparent", border: "none", outline: "none",
                                color: getRepDraft(activeDay.id, ex.name, setIdx) !== "" ? "#F0F0F0" : "#555",
                                fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", textAlign: "center",
                              }}
                            />
                            <button
                              onClick={() => toggleSet(exIdx, setIdx)}
                              title={done ? "Marcar serie sin hacer" : "Marcar serie hecha"}
                              style={{
                                width: "24px", height: "24px", borderRadius: "6px", flexShrink: 0,
                                border: `1px solid ${done ? activeDay.color : "#222"}`,
                                background: done ? activeDay.color : "transparent",
                                color: done ? "#0A0A0A" : "#2A2A2A",
                                fontSize: "11px", fontWeight: "700", cursor: "pointer",
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
