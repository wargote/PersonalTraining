import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { days } from "../data/routine";
import {
  splitKey,
  repsToIntArray,
  localCacheToRows,
  rowsToHistory,
  normalizeReps,
  normalizeWeights,
  entryVolume,
  weekStart,
  getDelta,
} from "../lib/logs";

const getWeightKey = (dayId, exerciseName) => `${dayId}::${exerciseName}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const noteKey = (dayId, date) => `${dayId}::${date}`;

export default function useWorkoutData(session) {
  const userId = session.user.id;
  const userEmail = session.user.email;

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

  // Valores que se están escribiendo antes de guardarlos, por serie: { key: [s0, s1, ...] }
  const [weightDrafts, setWeightDrafts] = useState({}); // peso
  const [repDrafts, setRepDrafts] = useState({}); // repeticiones logradas
  // Qué ejercicios tienen el historial desplegado
  const [openHistory, setOpenHistory] = useState({});
  const [syncState, setSyncState] = useState("loading"); // loading | ready | error

  // Notas de sesión por día+fecha: { "dayId::YYYY-MM-DD": { rpe, note } }
  const [sessionNotes, setSessionNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gym-session-notes") || "{}");
    } catch {
      return {};
    }
  });
  // Borradores de la nota que se está escribiendo antes de guardarla
  const [noteDrafts, setNoteDrafts] = useState({});

  // Caché offline: cada cambio del historial se guarda también en localStorage.
  useEffect(() => {
    localStorage.setItem("gym-weight-history", JSON.stringify(weightHistory));
  }, [weightHistory]);

  // Caché offline de las notas.
  useEffect(() => {
    localStorage.setItem("gym-session-notes", JSON.stringify(sessionNotes));
  }, [sessionNotes]);

  // Carga de notas desde Supabase (falla en silencio si la tabla aún no existe).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("session_notes")
        .select("day_id, log_date, rpe, note")
        .order("log_date", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("session_notes no disponible (¿falta crear la tabla?):", error.message);
        return;
      }
      const map = {};
      (data || []).forEach((r) => {
        map[`${r.day_id}::${r.log_date}`] = { rpe: r.rpe ?? null, note: r.note || "" };
      });
      setSessionNotes((prev) => ({ ...prev, ...map }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        // Se intenta con `weights` (peso por serie); si la migración aún no
        // corrió en Supabase, se reintenta sin esa columna.
        let { data, error } = await supabase
          .from("exercise_logs")
          .select("day_id, exercise_name, log_date, weight, reps, weights")
          .order("log_date", { ascending: false });
        if (error && /weights/i.test(error.message)) {
          ({ data, error } = await supabase
            .from("exercise_logs")
            .select("day_id, exercise_name, log_date, weight, reps")
            .order("log_date", { ascending: false }));
        }
        if (error) throw error;

        if (!cancelled) {
          const serverHistory = rowsToHistory(data || []);
          // La carga inicial corre en paralelo con la app ya usable: si el usuario
          // guarda una serie de hoy antes de que esta consulta resuelva, esa
          // escritura puede no estar todavía reflejada aquí. La conservamos en
          // vez de perderla al reemplazar el estado.
          setWeightHistory((prev) => {
            const merged = { ...serverHistory };
            const today = todayStr();
            Object.entries(prev).forEach(([key, list]) => {
              const localToday = list.find((e) => e.date === today);
              if (!localToday) return;
              const serverList = merged[key] || [];
              if (!serverList.some((e) => e.date === today)) {
                merged[key] = [localToday, ...serverList];
              }
            });
            return merged;
          });
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

  const getHistory = (dayId, name) => weightHistory[getWeightKey(dayId, name)] || [];
  const getLastEntry = (dayId, name) => getHistory(dayId, name)[0] || null;

  // --- Notas de sesión ---
  const getSavedNote = (dayId, date) => sessionNotes[noteKey(dayId, date)] || { rpe: null, note: "" };
  const getNoteDraft = (dayId, date) => {
    const key = noteKey(dayId, date);
    return noteDrafts[key] !== undefined ? noteDrafts[key] : getSavedNote(dayId, date);
  };
  const setNoteDraft = (dayId, date, patch) => {
    const key = noteKey(dayId, date);
    setNoteDrafts((prev) => ({
      ...prev,
      [key]: { ...getNoteDraft(dayId, date), ...patch },
    }));
  };

  const saveNote = (dayId, date) => {
    const key = noteKey(dayId, date);
    const draft = getNoteDraft(dayId, date);
    const rpe = draft.rpe ?? null;
    const note = (draft.note || "").trim();

    // Si la nota queda vacía, la eliminamos.
    if (rpe == null && note === "") {
      setSessionNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      supabase
        .from("session_notes")
        .delete()
        .match({ user_id: userId, day_id: dayId, log_date: date })
        .then(({ error }) => {
          if (error) console.warn("No se pudo borrar la nota en Supabase:", error.message);
        });
    } else {
      setSessionNotes((prev) => ({ ...prev, [key]: { rpe, note } }));
      supabase
        .from("session_notes")
        .upsert(
          { user_id: userId, day_id: dayId, log_date: date, rpe, note, updated_at: new Date().toISOString() },
          { onConflict: "user_id,day_id,log_date" }
        )
        .then(({ error }) => {
          if (error) console.warn("No se pudo guardar la nota en Supabase:", error.message);
        });
    }

    setNoteDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Entrada de hoy (si ya se guardó alguna serie de este ejercicio hoy).
  const getTodayEntry = (dayId, name) => {
    const today = todayStr();
    return getHistory(dayId, name).find((e) => e.date === today) || null;
  };

  // --- Peso por serie ---
  // Valor real (guardado hoy o borrador sin guardar). Vacío si no se ha tocado esa serie.
  const getSetWeight = (dayId, name, setIdx) => {
    const key = getWeightKey(dayId, name);
    const arr = weightDrafts[key];
    if (arr && arr[setIdx] !== undefined) return arr[setIdx];
    const todayEntry = getTodayEntry(dayId, name);
    if (todayEntry) {
      const w = normalizeWeights(todayEntry)[setIdx];
      if (w) return w;
    }
    return "";
  };

  const setSetWeight = (dayId, name, setIdx, value) => {
    const key = getWeightKey(dayId, name);
    setWeightDrafts((prev) => {
      const arr = prev[key] ? [...prev[key]] : [];
      arr[setIdx] = value;
      return { ...prev, [key]: arr };
    });
  };

  // Placeholder gris: peso de esa misma serie en la última sesión, o si no existe,
  // el valor efectivo de la serie anterior de hoy (copia el peso hacia abajo).
  const getSetWeightPlaceholder = (dayId, name, setIdx) => {
    const today = todayStr();
    const last = getHistory(dayId, name).find((e) => e.date !== today);
    if (last) {
      const arr = normalizeWeights(last);
      if (arr[setIdx]) return arr[setIdx];
      if (arr.length) return arr[arr.length - 1];
    }
    if (setIdx > 0) {
      return getSetWeight(dayId, name, setIdx - 1) || getSetWeightPlaceholder(dayId, name, setIdx - 1);
    }
    return "";
  };

  // --- Reps por serie ---
  const getRepValue = (dayId, name, setIdx) => {
    const key = getWeightKey(dayId, name);
    const arr = repDrafts[key];
    if (arr && arr[setIdx] !== undefined) return arr[setIdx];
    const todayEntry = getTodayEntry(dayId, name);
    if (todayEntry) {
      const r = normalizeReps(todayEntry)[setIdx];
      if (r) return r;
    }
    return "";
  };

  const setRepDraft = (dayId, name, setIdx, value) => {
    const key = getWeightKey(dayId, name);
    setRepDrafts((prev) => {
      const arr = prev[key] ? [...prev[key]] : [];
      arr[setIdx] = value;
      return { ...prev, [key]: arr };
    });
  };

  const getRepPlaceholder = (dayId, name, setIdx) => {
    const today = todayStr();
    const last = getHistory(dayId, name).find((e) => e.date !== today);
    const r = normalizeReps(last)[setIdx];
    return r || "";
  };

  const clearSetDrafts = (dayId, name, setIdx) => {
    const key = getWeightKey(dayId, name);
    setWeightDrafts((prev) => {
      if (!prev[key]) return prev;
      const arr = [...prev[key]];
      arr[setIdx] = undefined;
      return { ...prev, [key]: arr };
    });
    setRepDrafts((prev) => {
      if (!prev[key]) return prev;
      const arr = [...prev[key]];
      arr[setIdx] = undefined;
      return { ...prev, [key]: arr };
    });
  };

  const isSetDone = (dayId, name, setIdx) => {
    const entry = getTodayEntry(dayId, name);
    if (!entry) return false;
    return Boolean(normalizeWeights(entry)[setIdx]) || Boolean(normalizeReps(entry)[setIdx]);
  };

  const upsertTodayEntry = (dayId, name, weights, reps) => {
    const today = todayStr();
    const key = getWeightKey(dayId, name);
    const numericWeights = weights.map((w) => parseFloat(w)).filter((n) => !isNaN(n));
    const refWeight = numericWeights.length ? Math.max(...numericWeights) : NaN;
    const entry = { date: today, weight: String(refWeight), weights, reps };

    setWeightHistory((prev) => {
      const list = prev[key] ? [...prev[key]] : [];
      const idx = list.findIndex((e) => e.date === today);
      if (idx >= 0) list[idx] = entry;
      else list.unshift(entry);
      return { ...prev, [key]: list };
    });

    supabase
      .from("exercise_logs")
      .upsert(
        {
          user_id: userId,
          day_id: dayId,
          exercise_name: name,
          log_date: today,
          weight: refWeight,
          weights: weights.map((w) => {
            const n = parseFloat(w);
            return isNaN(n) ? null : n;
          }),
          reps: repsToIntArray(reps),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,day_id,exercise_name,log_date" }
      )
      .then(({ error }) => {
        if (error) console.error("No se pudo guardar en Supabase:", error);
      });
  };

  // Escribe el peso/reps de una sola serie dentro del registro de hoy (crea o actualiza).
  const writeSetValue = (dayId, name, setIdx, weightVal, repVal) => {
    const existing = getTodayEntry(dayId, name);
    const weights = normalizeWeights(existing);
    const reps = normalizeReps(existing);
    while (weights.length <= setIdx) weights.push("");
    while (reps.length <= setIdx) reps.push("");
    weights[setIdx] = weightVal;
    reps[setIdx] = repVal;
    upsertTodayEntry(dayId, name, weights, reps);
  };

  // Guarda (o actualiza) una serie: el peso escrito o, si no se tocó, el de referencia (placeholder).
  const saveSet = (dayId, name, setIdx) => {
    const weightVal = String(getSetWeight(dayId, name, setIdx) || getSetWeightPlaceholder(dayId, name, setIdx)).trim();
    if (weightVal === "") return;
    const repVal = String(getRepValue(dayId, name, setIdx) || getRepPlaceholder(dayId, name, setIdx)).trim();
    writeSetValue(dayId, name, setIdx, weightVal, repVal);
    clearSetDrafts(dayId, name, setIdx);
  };

  // Botones −/+ (paso 2.5kg). Si la serie ya está guardada hoy, el ajuste se escribe
  // directo (no queda como borrador pendiente); si no, solo actualiza el borrador.
  const bumpSetWeight = (dayId, name, setIdx, delta) => {
    const current = parseFloat(getSetWeight(dayId, name, setIdx) || getSetWeightPlaceholder(dayId, name, setIdx)) || 0;
    const value = String(Math.max(0, Math.round((current + delta) * 100) / 100));
    if (isSetDone(dayId, name, setIdx)) {
      const repVal = String(getRepValue(dayId, name, setIdx) || getRepPlaceholder(dayId, name, setIdx)).trim();
      writeSetValue(dayId, name, setIdx, value, repVal);
    } else {
      setSetWeight(dayId, name, setIdx, value);
    }
  };

  // Quita una serie del registro de hoy. Si no queda ninguna serie, borra el registro del día.
  const unsaveSet = (dayId, name, setIdx) => {
    const existing = getTodayEntry(dayId, name);
    if (!existing) return;
    const weights = normalizeWeights(existing);
    const reps = normalizeReps(existing);
    if (setIdx < weights.length) weights[setIdx] = "";
    if (setIdx < reps.length) reps[setIdx] = "";

    if (weights.every((w) => w === "")) {
      deleteEntry(dayId, name, todayStr());
    } else {
      upsertTodayEntry(dayId, name, weights, reps);
    }
    clearSetDrafts(dayId, name, setIdx);
  };

  const toggleSet = (dayId, name, setIdx) => {
    if (isSetDone(dayId, name, setIdx)) unsaveSet(dayId, name, setIdx);
    else saveSet(dayId, name, setIdx);
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

  // Estadísticas de progreso global (se recalculan solo cuando cambia el historial o las notas).
  const stats = useMemo(() => {
    // Volumen (tonelaje) y sesiones agrupados por semana.
    const byWeek = {}; // week -> tonelaje
    const sessionsByWeek = {}; // week -> Set("dayId::date")
    const sessionSet = new Set(); // todas las sesiones distintas (dayId::date)
    let totalVol = 0;

    Object.entries(weightHistory).forEach(([key, list]) => {
      const dayId = key.split("::")[0];
      list.forEach((e) => {
        const wk = weekStart(e.date);
        sessionSet.add(`${dayId}::${e.date}`);
        (sessionsByWeek[wk] || (sessionsByWeek[wk] = new Set())).add(`${dayId}::${e.date}`);
        const vol = entryVolume(e);
        if (vol > 0) {
          byWeek[wk] = (byWeek[wk] || 0) + vol;
          totalVol += vol;
        }
      });
    });

    const weekly = Object.keys(byWeek)
      .sort()
      .map((week) => ({ week, vol: byWeek[week], sessions: sessionsByWeek[week]?.size || 0 }));

    // Ejercicios que más subieron (peso máximo actual vs. primer registro).
    const improved = [];
    Object.entries(weightHistory).forEach(([key, list]) => {
      if (!list || list.length < 2) return;
      const [dayId, name] = splitKey(key);
      const weights = list.map((e) => parseFloat(e.weight)).filter((n) => !isNaN(n));
      if (weights.length < 2) return;
      const first = list[list.length - 1]; // más antiguo
      const firstW = parseFloat(first.weight);
      const maxW = Math.max(...weights);
      if (isNaN(firstW) || firstW <= 0 || maxW <= firstW) return;
      const day = days.find((d) => d.id === dayId);
      improved.push({
        name,
        color: day ? day.color : "#888",
        from: firstW,
        to: maxW,
        deltaPct: Math.round(((maxW - firstW) / firstW) * 100),
      });
    });
    improved.sort((a, b) => b.deltaPct - a.deltaPct);

    // Notas recientes (con día asociado), más nuevas primero.
    const notes = Object.entries(sessionNotes)
      .map(([key, val]) => {
        const [dayId, date] = splitKey(key);
        const day = days.find((d) => d.id === dayId);
        return { dayId, date, day, rpe: val.rpe, note: val.note || "" };
      })
      .filter((n) => n.rpe != null || n.note.trim() !== "")
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return {
      weekly,
      totalVol,
      totalSessions: sessionSet.size,
      improved: improved.slice(0, 5),
      notes: notes.slice(0, 12),
    };
  }, [weightHistory, sessionNotes]);

  return {
    userId,
    userEmail,
    weightHistory,
    syncState,
    sessionNotes,
    openHistory,
    stats,
    logout,
    getHistory,
    getLastEntry,
    getSavedNote,
    getNoteDraft,
    setNoteDraft,
    saveNote,
    getSetWeight,
    setSetWeight,
    getSetWeightPlaceholder,
    bumpSetWeight,
    getRepValue,
    setRepDraft,
    getRepPlaceholder,
    isSetDone,
    saveSet,
    toggleSet,
    deleteEntry,
    toggleHistory,
    getDelta,
    todayStr,
    getWeightKey,
  };
}
