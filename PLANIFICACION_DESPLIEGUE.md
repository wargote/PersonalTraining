# Plan de despliegue — PersonalTraining (gratis, con BD propia)

> App de rutina de hipertrofia (React + Vite). Hoy guarda los datos en el
> navegador (`localStorage`). El objetivo de esta fase es **publicarla en
> internet con una base de datos propia**, para que tus registros de peso,
> reps y PRs te sigan entre dispositivos (celular ↔ PC), **sin costo**.

---

## 1. Objetivo y alcance

**Meta:** que la app esté accesible desde una URL pública y que los datos se
guarden en una base de datos en la nube, sincronizados por usuario.

**Dentro de alcance (esta fase):**
- Hosting del frontend en una URL pública.
- Base de datos en la nube (Postgres).
- Login simple para que cada usuario vea solo sus datos.
- Migración de los datos que ya tienes en `localStorage` a la BD.

**Fuera de alcance (futuro):**
- App móvil nativa / PWA instalable (opcional, ver Fase 6).
- Estadísticas avanzadas, exportar a Excel, recordatorios, etc.
- Editar la rutina desde la UI (hoy la rutina vive en el código).

---

## 2. Stack recomendado (100% gratuito)

| Capa            | Servicio        | Capa gratuita                                   | Por qué |
|-----------------|-----------------|-------------------------------------------------|---------|
| Código          | **GitHub**      | Repos ilimitados                                | Necesario para desplegar en Vercel |
| Frontend        | **Vercel**      | Proyectos personales, dominio `*.vercel.app`, HTTPS, CI automático | Cero config para Vite |
| BD + Auth + API | **Supabase**    | Postgres 500 MB, Auth (50k usuarios), API auto  | BD real + login sin montar servidor |

**Alternativas equivalentes (por si prefieres):**
- Frontend: Netlify, Cloudflare Pages o GitHub Pages.
- BD/Auth: Firebase (Firestore) en vez de Supabase.

> ⚠️ **Importante del plan gratis de Supabase:** un proyecto sin actividad
> durante ~7 días se **pausa** automáticamente; se reactiva con un clic desde
> el panel. Para uso personal no es problema.

---

## 3. Arquitectura

```
[ Navegador / Celular ]
        │  (HTTPS)
        ▼
[ Vercel ]  ── sirve el frontend estático (React + Vite build)
        │
        │  llamadas a la API con @supabase/supabase-js
        ▼
[ Supabase ]
   ├── Auth        (login por email / magic link)
   ├── Postgres    (tabla exercise_logs)
   └── RLS         (cada usuario ve solo sus filas)
```

No hace falta escribir ni hospedar un backend propio: el cliente de Supabase
habla directo con la BD, protegido por **Row Level Security (RLS)**.

---

## 4. Modelo de datos

La rutina (días y ejercicios) **se queda en el código** (es fija). Solo los
**registros** van a la BD.

### Tabla `exercise_logs`

| Columna         | Tipo          | Notas |
|-----------------|---------------|-------|
| `id`            | `uuid`        | PK, default `gen_random_uuid()` |
| `user_id`       | `uuid`        | FK → `auth.users.id` |
| `day_id`        | `text`        | ej. `"lunes"` |
| `exercise_name` | `text`        | ej. `"Press inclinado con mancuernas"` |
| `log_date`      | `date`        | fecha de la sesión |
| `weight`        | `numeric`     | peso en kg |
| `reps`          | `int[]`       | reps por serie, ej. `{12,10,8}` |
| `created_at`    | `timestamptz` | default `now()` |
| `updated_at`    | `timestamptz` | default `now()` |

**Restricción única:** `(user_id, day_id, exercise_name, log_date)` → un
registro por ejercicio por día (igual que hoy: guardar dos veces el mismo día
actualiza, no duplica).

### SQL para crear todo (pegar en Supabase → SQL Editor)

```sql
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id text not null,
  exercise_name text not null,
  log_date date not null,
  weight numeric not null,
  reps int[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day_id, exercise_name, log_date)
);

-- Seguridad: cada quien ve y edita SOLO sus filas
alter table public.exercise_logs enable row level security;

create policy "own rows - select" on public.exercise_logs
  for select using (auth.uid() = user_id);
create policy "own rows - insert" on public.exercise_logs
  for insert with check (auth.uid() = user_id);
create policy "own rows - update" on public.exercise_logs
  for update using (auth.uid() = user_id);
create policy "own rows - delete" on public.exercise_logs
  for delete using (auth.uid() = user_id);
```

### Tabla `session_notes` (notas + RPE por sesión)

Guarda una nota y el esfuerzo percibido (RPE 1–10) por cada sesión (día + fecha).
La app funciona sin esta tabla (las notas quedan en `localStorage`), pero **para
que se sincronicen entre dispositivos hay que crearla**. Pegar en el SQL Editor:

```sql
create table public.session_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id text not null,
  log_date date not null,
  rpe int,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day_id, log_date)
);

alter table public.session_notes enable row level security;

create policy "own notes - select" on public.session_notes
  for select using (auth.uid() = user_id);
create policy "own notes - insert" on public.session_notes
  for insert with check (auth.uid() = user_id);
create policy "own notes - update" on public.session_notes
  for update using (auth.uid() = user_id);
create policy "own notes - delete" on public.session_notes
  for delete using (auth.uid() = user_id);
```

### Mapeo desde el `localStorage` actual

Hoy guardas en la clave `gym-weight-history`:

```js
{ "lunes::Press inclinado con mancuernas": [ { date, weight, reps: [12,10,8] }, ... ] }
```

Cada entrada del arreglo → una fila en `exercise_logs`:
- la parte antes de `::` → `day_id`
- la parte después de `::` → `exercise_name`
- `date` → `log_date`, `weight` → `weight`, `reps` → `reps`

---

## 5. Decisión: ¿con o sin login?

| Opción | Cuándo conviene | Implicación |
|--------|-----------------|-------------|
| **Con login (recomendado)** | Quieres tus datos en celular y PC, o más de un usuario | Activar Auth + RLS. ~30 min extra |
| **Sin login (single-user)** | Solo tú, un dispositivo, lo más simple | Una sola "cuenta anónima" o clave fija. RLS más laxo. Menos seguro |

**Recomendado:** login por **email (magic link)** — sin contraseñas que
recordar; Supabase manda un enlace al correo.

---

## 6. Fases y checklist

### Fase 0 — Preparación (local)
- [ ] Crear cuenta en GitHub, Vercel y Supabase (puedes entrar a todas con GitHub).
- [ ] Confirmar que `npm run build` funciona sin errores.
- [ ] Crear `.gitignore` que incluya `node_modules`, `dist` y `.env*` (ya existe `.gitignore`, verificar).

### Fase 1 — Subir el código a GitHub
- [ ] `git init` (el proyecto aún no es repo git).
- [ ] `git add . && git commit -m "Primera versión de PersonalTraining"`.
- [ ] Crear repo en GitHub y `git push`.

### Fase 2 — Configurar Supabase (BD + Auth)
- [ ] Crear proyecto en Supabase (elegir región cercana, ej. *East US*).
- [ ] SQL Editor → pegar y ejecutar el SQL de la sección 4.
- [ ] Authentication → Providers → activar **Email** (magic link).
- [ ] Copiar de *Project Settings → API*: `Project URL` y `anon public key`.

### Fase 3 — Conectar el frontend a Supabase
- [ ] Instalar el cliente: `npm install @supabase/supabase-js`.
- [ ] Crear `src/supabaseClient.js`:
  ```js
  import { createClient } from "@supabase/supabase-js";
  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  ```
- [ ] Crear `.env.local` (NO subir a git):
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
  ```
- [ ] Añadir login mínimo (pantalla que pide email y manda magic link).
- [ ] Reemplazar la lógica de `localStorage` por lecturas/escrituras a Supabase:
  - Al cargar: `select` de `exercise_logs` del usuario → reconstruir el estado.
  - Al guardar (`saveWeight`): `upsert` con la clave única.
  - Al borrar (`deleteEntry`): `delete` por `id`.
- [ ] Mantener `localStorage` como **caché offline** (opcional pero recomendado).

### Fase 4 — Migrar los datos existentes
- [ ] Al primer login, leer `gym-weight-history` de `localStorage`.
- [ ] Convertir cada entrada a fila y hacer `upsert` masivo a Supabase.
- [ ] Marcar la migración como hecha (otra clave en `localStorage`) para no repetir.

### Fase 5 — Desplegar en Vercel
- [ ] Importar el repo de GitHub en Vercel.
- [ ] Framework: **Vite** (lo autodetecta). Build: `npm run build`, output: `dist`.
- [ ] Cargar las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel.
- [ ] Deploy → obtienes la URL `https://personaltraining.vercel.app`.
- [ ] En Supabase → Authentication → URL Configuration: agregar la URL de Vercel como *Site URL* / *Redirect URL* (necesario para el magic link).

### Fase 6 — Extras opcionales (futuro)
- [ ] Convertir en **PWA** para "instalarla" en el celular como app y usarla offline.
- [ ] Dominio propio gratis (ej. con Vercel + un dominio gratuito).
- [ ] Persistir las series completadas (`completedSets`) en la BD.

---

## 7. Variables de entorno

| Variable                  | Dónde se usa        | Secreta |
|---------------------------|---------------------|---------|
| `VITE_SUPABASE_URL`       | Frontend (build)    | No (pública) |
| `VITE_SUPABASE_ANON_KEY`  | Frontend (build)    | No (pública, protegida por RLS) |

> La `anon key` es pública por diseño: la seguridad real la da **RLS** en la
> BD. Nunca expongas la `service_role key` en el frontend.

---

## 8. Costos y límites del plan gratis

| Servicio  | Límite gratis relevante                          | ¿Suficiente? |
|-----------|--------------------------------------------------|--------------|
| Vercel    | 100 GB de ancho de banda/mes, builds ilimitados  | Sí, de sobra |
| Supabase  | 500 MB de BD, 50k usuarios activos/mes, 1 GB archivos | Sí (tus datos son texto, pesan poquísimo) |
| GitHub    | Repos privados ilimitados                          | Sí |

**Costo total estimado: $0/mes.**

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Supabase pausa el proyecto tras ~7 días sin uso | Entrar al panel y reactivar (1 clic); o usarla seguido |
| Olvidar configurar RLS → datos expuestos | Ejecutar las policies de la sección 4 sí o sí |
| Subir las claves al repo por error | `.env.local` en `.gitignore`; las keys van en Vercel |
| Perder datos al migrar | La migración solo hace `upsert` (no borra `localStorage`) |

---

## 10. Cronograma sugerido

| Fase | Esfuerzo aprox. |
|------|-----------------|
| 0 — Preparación + cuentas | 30 min |
| 1 — GitHub | 15 min |
| 2 — Supabase (BD + Auth) | 30 min |
| 3 — Conectar frontend | 2–3 h |
| 4 — Migración de datos | 1 h |
| 5 — Deploy en Vercel | 30 min |
| **Total** | **~1 día de trabajo tranquilo** |

---

### Resumen en una línea
GitHub (código) → Vercel (web) → Supabase (BD + login), todo gratis, con los
registros sincronizados por usuario y migrando lo que ya tienes guardado.
