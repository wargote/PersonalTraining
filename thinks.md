# Plan de mejoras — PersonalTraining

Documento de trabajo para dejar la app más clara y más cómoda de usar.
Todo el código vive hoy en un solo componente: `src/rutina_hipertrofia.jsx` (~1400 líneas, estilos inline).

---

## Objetivos (lo que pediste)

1. **Navegación tipo app de celular** → cambiar los botones actuales por un **menú inferior fijo**.
2. **Registro de peso + repeticiones más claro** → hoy se siente enredado; rediseñarlo.

---

## Decisiones tomadas

- **Registro:** una **fila por serie** (peso + reps + check en cada línea). Permite peso distinto por serie (drop sets / pirámide).
- **Menú inferior:** **5 pestañas** → Rutina · Progreso · Volumen · PRs · **Perfil** (el email, estado de sync y "Salir" se mueven a Perfil).
- **Esquema:** se guarda **peso por serie** → nueva columna `weights numeric[]` en `exercise_logs` (opción A). Compatible con lo actual.
- **Paso del ± de peso:** **2.5 kg** por toque (además se puede escribir el valor exacto).
- **Arquitectura:** se **parte el archivo en componentes** (hoy todo está en un solo archivo de ~1400 líneas).

---

## 1 · Menú inferior (bottom navigation)

### Cómo queda
```
┌──────────────────────────────────────┐
│  🏋️     📈      📊     🏆     👤      │
│ Rutina Progreso Volumen PRs   Perfil  │
└──────────────────────────────────────┘
```

- Barra **fija abajo** (`position: fixed; bottom: 0`), ancho completo, misma estética oscura.
- Cada tab = ícono + etiqueta corta. La activa se pinta con `activeDay.color` (mantiene el acento por día).
- Respeta el notch del celular: padding inferior con `env(safe-area-inset-bottom)`.
- El contenido gana `padding-bottom` para que la barra no tape la última tarjeta.

### Cambios respecto a hoy
- **Se elimina** el bloque de 4 botones apilados arriba a la derecha.
- **Se elimina** el botón "SALIR" del header → se mueve a la pestaña **Perfil**.
- Las **pestañas de días (LUN…DOM)** dejan de vivir sueltas: solo aparecen **dentro de Rutina** (que es donde tienen sentido). Se quedan como fila horizontal deslizable arriba del contenido de Rutina.
- El header se simplifica: título "HIPERTROFIA · 5 DÍAS" y poco más.

### Nueva pestaña "Perfil"
Reúne lo que hoy está disperso:
- Email conectado (`session.user.email`).
- Estado de sincronización (loading / listo / ⚠ offline) — hoy está escondido en el texto del botón Salir.
- Botón **Salir**.
- Espacio para ajustes futuros (unidades kg/lb, tema, exportar datos…).

---

## 2 · Registro de peso + reps — "una fila por serie"

### El problema de hoy
- El **peso** está arriba (uno solo para todas las series) y las **reps** abajo en chips S1/S2/S3: dos zonas separadas que en realidad se guardan juntas → confunde.
- El check ✓ de cada serie **no guarda nada** (solo pinta la serie); parece que sí.
- Solo permite un peso para todas las series.
- Los campos se auto-rellenan con lo anterior y no queda claro qué es nuevo.

### Cómo queda
```
Press inclinado con mancuernas         3×10–12   ★PR 62.5
último: 60kg · 12/10/8 · 5 jul
────────────────────────────────────────────────────
 S1   [ − 62.5 + ] kg   [ 12 ] reps   [ ✓ ]
 S2   [ − 62.5 + ] kg   [ 10 ] reps   [ ✓ ]
 S3   [ − 60.0 + ] kg   [  8 ] reps   [ ○ ]
```

- **Una línea por serie**: `Sn · peso · reps · check`. Todo junto, se lee de izquierda a derecha.
- **Peso por serie** con botones **− / +** (paso 2.5 kg) además de poder escribirlo. Por defecto todas arrancan con el mismo peso, pero puedes cambiar una sola (drop set).
- **El check ✓ guarda esa serie** (auto-guardado por serie). Se acabó la distinción confusa entre "marcar hecho" y "guardar": marcar = registrar.
- La serie guardada se pinta con el color del día (feedback claro de "hecha y guardada").
- **Pre-relleno**: peso y reps se muestran como *placeholder gris* con el valor de la última sesión, no como texto ya escrito. Así distingues lo nuevo de la referencia.
- La referencia "último: 60kg · 12/10/8 · 5 jul" y el "★ PR" quedan arriba, una sola vez por ejercicio (no repetidos por serie).
- **Historial** (lista + mini-gráfica) se conserva igual, desplegable bajo el ejercicio.

### Reglas de comportamiento
- **Paso del ± de peso:** 2.5 kg por toque. También se puede escribir el número exacto.
- **Auto-guardado al marcar ✓:** al marcar la serie se registra (peso + reps de esa serie). Si la desmarcas, se quita ese registro del día.
- El peso de una serie nueva arranca copiando el de la serie anterior (o el de la última sesión); cambiar una no afecta a las demás.

### Cambio de esquema (Supabase) — peso por serie

Hoy `exercise_logs` guarda un solo `weight numeric` + `reps int[]`. Añadimos un
arreglo de pesos por serie, **sin romper lo existente**:

```sql
-- Migración: pegar en Supabase → SQL Editor
alter table public.exercise_logs
  add column if not exists weights numeric[] default '{}';
```

- `weights[]` pasa a ser la fuente de verdad del peso por serie (paralelo a `reps[]`).
- `weight` (columna vieja, `not null`) se sigue rellenando con el peso de referencia
  (ej. el de la 1ª serie o el máximo) para no romper el resto de la app ni datos previos.
- Al cargar, si una fila no tiene `weights[]` (registros antiguos), se deriva de
  `weight` repetido para todas las series → retrocompatible.

---

## Arquitectura en componentes

Hoy todo vive en `src/rutina_hipertrofia.jsx`. Lo partimos en piezas con
responsabilidad clara (estructura propuesta):

```
src/
├── App.jsx                  (sesión / login — ya existe)
├── data/
│   └── routine.js           días, ejercicios, colores, volumeSummary
├── lib/
│   ├── supabaseClient.js    (ya existe)
│   ├── logs.js              helpers de datos (splitKey, rowsToHistory, volumen…)
│   └── stats.js             cálculos de progreso (semana, PR, delta, tonelaje)
├── hooks/
│   └── useWorkoutData.js    carga/guardado con Supabase + caché local + estado
└── components/
    ├── GymRoutine.jsx       contenedor: estado de vista + layout
    ├── BottomNav.jsx        menú inferior de 5 pestañas
    ├── DayTabs.jsx          selector de días (dentro de Rutina)
    ├── ExerciseCard.jsx     tarjeta con las filas por serie ← el rediseño clave
    ├── RutinaView.jsx
    ├── ProgresoView.jsx
    ├── VolumenView.jsx
    ├── RecordsView.jsx
    └── PerfilView.jsx       email, estado de sync, salir
```

La lógica de datos (hoy mezclada con el render) se mueve a `hooks/` y `lib/`, de
modo que los componentes de vista queden casi solo de presentación.

---

## Orden de implementación sugerido

1. **Extraer datos y helpers** a `data/` y `lib/` sin cambiar comportamiento (base para todo lo demás).
2. **Menú inferior + Perfil** (bajo riesgo, visual): `BottomNav`, mover Salir/sync a `PerfilView`, meter días dentro de Rutina.
3. **Migración de esquema**: correr el `alter table` de `weights[]` en Supabase.
4. **Registro por serie**: rediseñar `ExerciseCard` a filas por serie con ± y check-guarda; adaptar el guardado a `weights[]`.
5. **Pulido**: safe-area, padding inferior, transiciones; revisar Progreso/Volumen/PRs con la nueva navegación.

---

## Todo decidido ✓
- Registro: una fila por serie.
- Menú inferior: 5 pestañas con Perfil.
- Esquema: columna `weights numeric[]` (retrocompatible).
- Paso del ± de peso: 2.5 kg.
- Se parte el archivo en componentes.
