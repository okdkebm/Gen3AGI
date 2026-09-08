import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR } from "../lib/types";

export function TaskTimeline() {
  const tasks = useDeckStore((s) => s.tasks);

  return (
    <div
      className="hud-panel"
      style={{
        bottom: 14,
        left: 14,
        right: 14,
        height: 64,
        padding: "8px 14px",
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 10,
      }}
    >
      <span className="panel-corner corner-tl" />
      <span className="panel-corner corner-tr" />
      <span className="panel-corner corner-bl" />
      <span className="panel-corner corner-br" />

      <span style={{ color: "#00e5ff", fontSize: 10, letterSpacing: "0.14em", flexShrink: 0 }}>
        TASK CHAIN
      </span>

      {tasks.length === 0 && (
        <span style={{ color: "#5a6472", fontSize: 10 }}>选择 Flow 以显示攻击链</span>
      )}

      {tasks.map((t, i) => {
        const color = STATUS_COLOR[t.status] ?? "#7a8699";
        const done = t.status === "finished";
        return (
          <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {i > 0 && <span style={{ color: "#2a3c52", fontSize: 12 }}>→</span>}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                border: `1px solid ${color}${done ? "" : "66"}`,
                borderRadius: 3,
                background: done ? "rgba(57,255,136,0.06)" : "rgba(4,7,13,0.6)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
              <span style={{ color: color, fontSize: 10, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.title}
              </span>
              <span style={{ color: "#5a6472", fontSize: 9 }}>
                {(t.subtasks?.length ?? 0)}子
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
