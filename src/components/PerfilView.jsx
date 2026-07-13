export default function PerfilView({ userEmail, syncState, logout, activeDay }) {
  const syncLabel = syncState === "loading" ? "SINCRONIZANDO..." : syncState === "error" ? "⚠ SIN CONEXIÓN" : "✓ SINCRONIZADO";
  const syncColor = syncState === "loading" ? "#8E8E8E" : syncState === "error" ? "#FF6B6B" : "#47FF88";

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#7E7E7E", marginBottom: "16px" }}>PERFIL</div>

      <div style={{
        background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px",
        padding: "16px", marginBottom: "10px",
      }}>
        <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#7E7E7E", textTransform: "uppercase", marginBottom: "6px" }}>
          Cuenta
        </div>
        <div style={{ fontSize: "13px", color: "#F0F0F0", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", marginBottom: "10px" }}>
          {userEmail}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "9px", letterSpacing: "1px", fontWeight: "700", color: syncColor,
        }}>
          {syncLabel}
        </div>
      </div>

      <div style={{
        background: "#111", border: "1px solid #1A1A1A", borderRadius: "12px",
        padding: "16px", marginBottom: "10px",
      }}>
        <div style={{ fontSize: "8px", letterSpacing: "2px", color: "#7E7E7E", textTransform: "uppercase", marginBottom: "8px" }}>
          Ajustes
        </div>
        <div style={{ fontSize: "11px", color: "#5A5A5A", lineHeight: 1.6 }}>
          Unidades (kg/lb), tema y exportar datos — próximamente.
        </div>
      </div>

      <button
        onClick={logout}
        style={{
          width: "100%", border: `1px solid ${activeDay.color}30`, borderRadius: "10px",
          background: "transparent", color: activeDay.color, fontSize: "10px",
          fontWeight: "700", letterSpacing: "2px", padding: "12px",
          cursor: "pointer", fontFamily: "'DM Mono', monospace",
        }}
      >
        SALIR
      </button>
    </div>
  );
}
