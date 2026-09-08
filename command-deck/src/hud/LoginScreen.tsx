import { useState } from "react";
import { useDeckStore } from "../lib/useStore";

export function LoginScreen() {
  const login = useDeckStore((s) => s.login);
  const loginError = useDeckStore((s) => s.loginError);
  const loading = useDeckStore((s) => s.loading);
  const [email, setEmail] = useState("admin@pentagi.com");
  const [password, setPassword] = useState("");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.08), rgba(4,7,13,0.9) 60%), #04070d",
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
        style={{
          width: 340,
          padding: "32px 28px",
          background: "rgba(10,18,32,0.85)",
          border: "1px solid rgba(0,229,255,0.25)",
          borderRadius: 8,
          boxShadow: "0 0 40px rgba(0,229,255,0.08), inset 0 0 24px rgba(0,229,255,0.04)",
          fontFamily: "var(--mono)",
        }}
      >
        <div style={{ color: "#00e5ff", fontSize: 14, letterSpacing: "0.2em", marginBottom: 4, fontWeight: 600 }}>
          GEN3AGI
        </div>
        <div style={{ color: "#8a94a6", fontSize: 11, marginBottom: 24, letterSpacing: "0.1em" }}>
          攻击态势指挥台 · CONNECT TO PENTAGI
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ color: "#8a94a6", fontSize: 10, display: "block", marginBottom: 4 }}>EMAIL</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "block", marginBottom: 18 }}>
          <span style={{ color: "#8a94a6", fontSize: 10, display: "block", marginBottom: 4 }}>PASSWORD</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {loginError && (
          <div style={{ color: "#ff3d5a", fontSize: 11, marginBottom: 12 }}>✕ {loginError}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "rgba(0,229,255,0.12)",
            color: "#00e5ff",
            border: "1px solid rgba(0,229,255,0.4)",
            borderRadius: 4,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.2em",
          }}
        >
          {loading ? "CONNECTING…" : "ENTER THE DECK"}
        </button>

        <div style={{ color: "#5a6472", fontSize: 9, marginTop: 16, lineHeight: 1.6 }}>
          默认账号 admin@pentagi.com / admin（首次部署）
          <br />
          需先通过 PentAGI Web UI (8443) 登录一次以建立会话
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "rgba(4,7,13,0.6)",
  border: "1px solid rgba(138,148,166,0.3)",
  color: "#c8d0de",
  borderRadius: 4,
  fontFamily: "var(--mono)",
  fontSize: 12,
  outline: "none",
};
