import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { days as defaultDays, muscleColors as defaultMuscleColors } from "../data/routine";

const CACHE_KEY = "gym-routine";

export default function useRoutine(session) {
  const userId = session.user.id;

  const [days, setDays] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached?.days?.length) return cached.days;
    } catch {
      // ignore
    }
    return defaultDays;
  });
  const [muscleColors, setMuscleColors] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached?.muscleColors) return cached.muscleColors;
    } catch {
      // ignore
    }
    return defaultMuscleColors;
  });
  const [libraryExercises, setLibraryExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routineSyncState, setRoutineSyncState] = useState("loading"); // loading | ready | error

  // Caché offline: cualquier rutina cargada/editada se guarda también en localStorage.
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ days, muscleColors }));
  }, [days, muscleColors]);

  // Carga (o siembra) la rutina del usuario desde Supabase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("routines")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;

        if (data) {
          // La fila ya existe: se respeta tal cual, incluso si el usuario dejó la
          // rutina vacía a propósito (solo se cae a la semilla si `data` viniera nulo).
          setDays(data.data?.days ?? defaultDays);
          setMuscleColors(data.data?.muscleColors ?? defaultMuscleColors);
        } else {
          // Primer login con esta tabla ya creada: se siembra con la rutina por defecto
          // para no perder lo que ya existía hardcodeado.
          const seed = { days: defaultDays, muscleColors: defaultMuscleColors };
          const { error: insertError } = await supabase
            .from("routines")
            .insert({ user_id: userId, data: seed });
          if (insertError) throw insertError;
          if (!cancelled) {
            setDays(seed.days);
            setMuscleColors(seed.muscleColors);
          }
        }
        if (!cancelled) setRoutineSyncState("ready");
      } catch (err) {
        console.warn("routines no disponible (¿falta crear la tabla?):", err.message);
        if (!cancelled) setRoutineSyncState("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Carga la biblioteca personal de ejercicios (para autocompletar en el editor).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("name, muscle")
        .order("name");
      if (cancelled) return;
      if (error) {
        console.warn("exercise_library no disponible (¿falta crear la tabla?):", error.message);
        return;
      }
      setLibraryExercises(data || []);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveRoutine = async (newDays, newMuscleColors) => {
    const { error } = await supabase
      .from("routines")
      .upsert(
        { user_id: userId, data: { days: newDays, muscleColors: newMuscleColors }, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    setDays(newDays);
    setMuscleColors(newMuscleColors);
  };

  // Guarda (o actualiza) un ejercicio en la biblioteca personal, para autocompletarlo después.
  const upsertLibraryExercise = (name, muscle) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLibraryExercises((prev) =>
      prev.some((e) => e.name === trimmed) ? prev : [...prev, { name: trimmed, muscle }].sort((a, b) => a.name.localeCompare(b.name))
    );
    supabase
      .from("exercise_library")
      .upsert({ user_id: userId, name: trimmed, muscle }, { onConflict: "user_id,name" })
      .then(({ error }) => {
        if (error) console.warn("No se pudo guardar en la biblioteca de ejercicios:", error.message);
      });
  };

  return {
    days,
    muscleColors,
    libraryExercises,
    loading,
    routineSyncState,
    saveRoutine,
    upsertLibraryExercise,
  };
}
