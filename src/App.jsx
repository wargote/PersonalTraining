import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import GymRoutine from "./components/GymRoutine";
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

  const demoLogin = import.meta.env.DEV
    ? () => setSession({ user: { id: "demo-user", email: "demo@local" } })
    : undefined;

  if (loading) return <Splash />;
  if (!session) return <Login onDemoLogin={demoLogin} />;
  return <GymRoutine session={session} />;
}

export default App;
