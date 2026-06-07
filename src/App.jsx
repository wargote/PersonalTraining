import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import GymRoutine from "./rutina_hipertrofia";
import Login from "./Login";

function Splash() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#444",
        fontFamily: "'DM Mono', monospace",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        letterSpacing: "2px",
      }}
    >
      CARGANDO...
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <Splash />;
  if (!session) return <Login />;
  return <GymRoutine session={session} />;
}

export default App;
