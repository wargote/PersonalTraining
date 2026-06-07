import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Ayuda a detectar rápido si faltan las variables de entorno en local o en Vercel.
  console.error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
      "Revisa el archivo .env.local (local) o las Environment Variables en Vercel."
  );
}

export const supabase = createClient(url, key);
