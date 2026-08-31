// --- Helpers de la rutina editable (días/ejercicios definidos por el usuario) ---

// Los 7 días de la semana con su metadata fija (id estable, abreviatura, nombre completo).
// A diferencia de `days` (en data/routine.js), esto no cambia con la edición: es el
// catálogo completo de días disponibles para activar/desactivar en el editor.
export const weekdays = [
  { id: "lunes", label: "LUN", fullLabel: "Lunes" },
  { id: "martes", label: "MAR", fullLabel: "Martes" },
  { id: "miercoles", label: "MIÉ", fullLabel: "Miércoles" },
  { id: "jueves", label: "JUE", fullLabel: "Jueves" },
  { id: "viernes", label: "VIE", fullLabel: "Viernes" },
  { id: "sabado", label: "SÁB", fullLabel: "Sábado" },
  { id: "domingo", label: "DOM", fullLabel: "Domingo" },
];

// Paleta rotativa: se usa para asignar color automático a un grupo muscular o
// día nuevo que todavía no tiene color asignado.
export const colorPalette = [
  "#FF9F47", "#47C4FF", "#FF6B6B", "#FF47C4", "#C447FF", "#E8FF47",
  "#47FFB4", "#47FFE8", "#FFD447", "#A0FF47", "#FF8A47", "#D147FF",
  "#47FFDA", "#FF478E", "#8EFF47",
];

// Próximo color libre de la paleta dado un conjunto de colores ya en uso.
export const nextAvailableColor = (usedColors) => {
  const used = new Set(usedColors);
  return colorPalette.find((c) => !used.has(c)) || colorPalette[usedColors.length % colorPalette.length];
};

// Da el color de un músculo; si es nuevo, elige el próximo color libre de la paleta.
export const colorForMuscle = (muscle, muscleColors) =>
  muscleColors[muscle] || nextAvailableColor(Object.values(muscleColors));

// Agrupa las series semanales por músculo a partir de los días de la rutina.
// Reemplaza el `volumeSummary` que antes venía hardcodeado.
export const computeVolumeSummary = (days) => {
  const byMuscle = {}; // muscle -> { sets, days: Set(label) }
  days.forEach((day) => {
    (day.exercises || []).forEach((ex) => {
      const entry = byMuscle[ex.muscle] || (byMuscle[ex.muscle] = { sets: 0, days: new Set() });
      entry.sets += Number(ex.sets) || 0;
      entry.days.add(day.label);
    });
  });
  return Object.entries(byMuscle)
    .map(([m, { sets, days: dayLabels }]) => ({ m, s: sets, days: Array.from(dayLabels).join(" + ") }))
    .sort((a, b) => b.s - a.s);
};

let uid = 0;
// id local para filas nuevas en el editor antes de guardarlas (no se persiste, solo para React keys).
export const tempId = () => `tmp-${Date.now()}-${uid++}`;
