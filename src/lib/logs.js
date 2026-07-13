// --- Helpers de conversión entre el formato local y las filas de Supabase ---

// "lunes::Press inclinado" -> ["lunes", "Press inclinado"]
export const splitKey = (key) => {
  const idx = key.indexOf("::");
  if (idx === -1) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 2)];
};

// reps puede venir como array de strings/números o como string suelto -> int[]
export const repsToIntArray = (reps) => {
  if (reps == null) return [];
  const arr = Array.isArray(reps) ? reps : [reps];
  return arr
    .map((r) => parseInt(r, 10))
    .filter((n) => !Number.isNaN(n));
};

// localStorage (gym-weight-history) -> filas listas para upsert en exercise_logs
export const localCacheToRows = (userId) => {
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
export const rowsToHistory = (rows) => {
  const map = {};
  rows.forEach((row) => {
    const key = `${row.day_id}::${row.exercise_name}`;
    if (!map[key]) map[key] = [];
    const entry = { date: row.log_date, weight: String(row.weight) };
    if (Array.isArray(row.reps) && row.reps.length) {
      entry.reps = row.reps.map(String);
    }
    if (Array.isArray(row.weights) && row.weights.length) {
      entry.weights = row.weights.map((w) => (w == null ? "" : String(w)));
    }
    map[key].push(entry);
  });
  // Cada lista ordenada de más reciente a más antigua (la query ya viene desc, pero aseguramos).
  Object.values(map).forEach((list) =>
    list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  );
  return map;
};

// Reps siempre como arreglo (una por serie). Tolera el formato viejo (string).
export const normalizeReps = (entry) => {
  if (!entry) return [];
  const r = entry.reps;
  if (Array.isArray(r)) return r.map((x) => (x == null ? "" : String(x)));
  if (r == null || r === "") return [];
  return [String(r)];
};

// Peso por serie como arreglo. Si el registro es viejo (solo `weight` único),
// lo repite para cada serie conocida → retrocompatible con datos previos.
export const normalizeWeights = (entry) => {
  if (!entry) return [];
  const w = entry.weights;
  if (Array.isArray(w) && w.length) return w.map((x) => (x == null ? "" : String(x)));
  if (entry.weight == null || entry.weight === "") return [];
  const repsLen = normalizeReps(entry).length;
  return Array(repsLen || 1).fill(String(entry.weight));
};

// Peso(s) de una entrada listos para mostrar: "62.5/62.5/60" si hay varios, o el único valor.
export const weightsLabel = (entry) => {
  const w = normalizeWeights(entry);
  return w.length > 1 ? w.join("/") : entry.weight ?? "";
};

// Récord personal: mayor peso registrado en una sola serie (a igual peso, más reps)
export const getPR = (history) => {
  let best = null;
  history.forEach((e) => {
    const weights = normalizeWeights(e);
    const reps = normalizeReps(e);
    weights.forEach((wStr, i) => {
      const w = parseFloat(wStr);
      if (isNaN(w)) return;
      const r = parseFloat(reps[i]);
      if (
        best === null ||
        w > best.w ||
        (w === best.w && !isNaN(r) && (isNaN(best.r) || r > best.r))
      ) {
        best = { w, r, weight: wStr, reps: reps[i] != null && reps[i] !== "" ? [reps[i]] : [], date: e.date };
      }
    });
  });
  return best;
};

// Diferencia entre la sesión más reciente y la anterior
export const getDelta = (history) => {
  if (history.length < 2) return null;
  const cur = parseFloat(history[0].weight);
  const prev = parseFloat(history[1].weight);
  if (isNaN(cur) || isNaN(prev)) return null;
  return Math.round((cur - prev) * 100) / 100;
};

// --- Helpers de progreso (volumen / tonelaje y agrupación por semana) ---

// Lunes (YYYY-MM-DD) de la semana a la que pertenece una fecha ISO.
export const weekStart = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
};

// Tonelaje de una entrada: suma de (peso de cada serie × sus reps).
// Si no hay reps anotadas, no se puede calcular volumen real → 0.
export const entryVolume = (entry) => {
  const reps = normalizeReps(entry);
  if (!reps.length) return 0;
  const weights = normalizeWeights(entry);
  let vol = 0;
  reps.forEach((r, i) => {
    const repsN = parseInt(r, 10);
    const w = parseFloat(weights[i] ?? entry.weight);
    if (!isNaN(repsN) && !isNaN(w)) vol += repsN * w;
  });
  return vol;
};

// Formatea kilos grandes de forma compacta: 12450 -> "12.4k"
export const fmtKg = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
};

export const fmtDate = (iso) => {
  const [, m, d] = iso.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[m - 1]}`;
};
