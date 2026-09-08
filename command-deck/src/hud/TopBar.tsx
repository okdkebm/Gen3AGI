import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR } from "../lib/types";

export function TopBar() {
  const flows = useDeckStore((s) => s.flows);
  const activeFlow = useDeckStore((s) => s.activeFlow);
  const selectFlow = useDeckStore((s) => s.selectFlow);
  const loadFlows = useDeckStore((s) => s.loadFlows);

  const statusColor = activeFlow ? STATUS_COLOR[activeFlow.status] ?? "#7a8699" : "#7a8699";

  return (
    <div
      className="hud-panel"
      style={{
        top: 14,
        left: 14,
        right: 14,
        height: 46,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 16,
        zIndex: 20,
      }}
    >
      <span
        className="panel-corner corner-tl"
        style={{ top: -1, left: -1 }}
      />
      <span className="panel-corner corner-tr" />
      <span className="panel-corner corner-bl" />
      <span className="panel-corner corner-br" />

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
        <span style={{ color: "#00e5ff", fontWeight: 700, fontSize: 13, letterSpacing: "0.18em" }}>
          GEN3AGI
        </span>
        <span style={{ color: "#5a6472", fontSize: 9, letterSpacing: "0.14em" }}>
          COMMAND DECK · v0.1
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "rgba(0,229,255,0.2)" }} />

      {/* Flow 选择器 */}
      <select
        value={activeFlow?.id ?? ""}
        onChange={(e) => {
          if (e.target.value) selectFlow(e.target.value);
        }}
        style={{
          background: "rgba(4,7,13,0.6)",
          border: "1px solid rgba(0,229,255,0.3)",
          color: "#c8d0de",
          fontFamily: "var(--mono)",
          fontSize: 11,
          padding: "5px 8px",
          borderRadius: 3,
          outline: "none",
          maxWidth: 320,
        }}
      >
        {flows.length === 0 && <option value="">暂无 Flow（点击刷新）</option>}
        {flows.map((f) => (
          <option key={f.id} value={f.id}>
            {f.title} · {f.status}
          </option>
        ))}
      </select>

      <button
        onClick={() => loadFlows()}
        style={btnStyle}
        title="刷新 Flow 列表"
      >
        ⟳ 刷新
      </button>

      <div style={{ flex: 1 }} />

      {/* 当前 Flow 状态 */}
      {activeFlow && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColor,
              boxShadow: `0 0 10px ${statusColor}`,
            }}
          />
          <span style={{ color: statusColor, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {activeFlow.status}
          </span>
          <span style={{ color: "#5a6472", fontSize: 10 }}>
            provider: {activeFlow.provider?.name ?? "-"}
          </span>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(0,229,255,0.08)",
  color: "#00e5ff",
  border: "1px solid rgba(0,229,255,0.3)",
  borderRadius: 3,
  fontFamily: "var(--mono)",
  fontSize: 10,
  padding: "5px 10px",
  cursor: "pointer",
};
