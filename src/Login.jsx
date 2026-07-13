import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Login({ onDemoLogin }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const sendLink = async (e) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setStatus("sending");
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F0F0F0",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#8E8E8E", textTransform: "uppercase", marginBottom: "6px" }}>
          Torso · Pierna · Empuje · Tirón
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 8vw, 40px)",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: "800",
            letterSpacing: "-2px",
            margin: "0 0 28px",
            lineHeight: 1,
          }}
        >
          HIPERTROFIA<br />
          <span style={{ color: "#E8FF47" }}>5 DÍAS</span>
        </h1>

        {status === "sent" ? (
          <div
            style={{
              background: "#0D1A0D",
              border: "1px solid #47FF8830",
              borderRadius: "12px",
              padding: "18px",
              fontSize: "12px",
              color: "#9Fe9b0",
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: "#47FF88", fontWeight: 700, marginBottom: "6px", letterSpacing: "1px" }}>
              ✓ REVISA TU CORREO
            </div>
            Te enviamos un enlace de acceso a <strong>{email.trim()}</strong>. Ábrelo en
            este mismo dispositivo para entrar. (Revisa también spam.)
            <button
              onClick={() => { setStatus("idle"); setEmail(""); }}
              style={{
                display: "block", marginTop: "14px", background: "transparent",
                border: "none", color: "#9C9C9C", fontSize: "10px", letterSpacing: "1px",
                cursor: "pointer", fontFamily: "'DM Mono', monospace", padding: 0,
              }}
            >
              ← Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink}>
            <label style={{ fontSize: "9px", letterSpacing: "2px", color: "#9C9C9C", textTransform: "uppercase" }}>
              Entrar con tu correo
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "12px 14px",
                background: "#111",
                border: "1px solid #222",
                borderRadius: "10px",
                color: "#F0F0F0",
                fontSize: "14px",
                fontFamily: "'DM Mono', monospace",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: status === "sending" ? "#161616" : "#E8FF47",
                color: status === "sending" ? "#9C9C9C" : "#0A0A0A",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                fontFamily: "'DM Mono', monospace",
                cursor: status === "sending" ? "default" : "pointer",
              }}
            >
              {status === "sending" ? "ENVIANDO..." : "ENVIAR ENLACE MÁGICO"}
            </button>
            {status === "error" && (
              <div style={{ marginTop: "12px", fontSize: "11px", color: "#FF6B6B", lineHeight: 1.5 }}>
                {error}
              </div>
            )}
            <div style={{ marginTop: "16px", fontSize: "10px", color: "#7E7E7E", lineHeight: 1.6 }}>
              Sin contraseñas: te llega un enlace al correo y con eso entras. Tus
              registros quedan guardados y sincronizados entre tus dispositivos.
            </div>
          </form>
        )}

        {import.meta.env.DEV && onDemoLogin && (
          <button
            onClick={onDemoLogin}
            style={{
              display: "block",
              width: "100%",
              marginTop: "24px",
              padding: "10px",
              borderRadius: "10px",
              border: "1px dashed #333",
              background: "transparent",
              color: "#7E7E7E",
              fontSize: "10px",
              letterSpacing: "1px",
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer",
            }}
          >
            🧪 MODO DEMO (solo dev, sin datos reales)
          </button>
        )}
      </div>
    </div>
  );
}
