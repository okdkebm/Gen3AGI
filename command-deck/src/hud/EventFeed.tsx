import { useEffect, useRef } from "react";
import { useDeckStore } from "../lib/useStore";

function colorOf(line: string): string {
  if (line.includes("→ failed") || line.includes("stderr") || line.includes("✕")) return "#ff3d5a";
  if (line.includes("→ finished") || line.includes("→ running")) return "#39ff88";
  if (line.includes("工具") || line.includes("tool")) return "#ffb020";
  return "#8a94a6";
}

export function EventFeed() {
  const events = useDeckStore((s) => s.eventLog);
  const clearEvents = useDeckStore((s) => s.clearEvents);
  const boxRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = 0;
  }, [events]);

  return (
    <div
      className="hud-panel"
      style={{
        top: 76,
        right: 14,
        width: 320,
        bottom: 92,
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      <span className="panel-corner corner-tl" />
      <span className="panel-corner corner-tr" />
      <span className="panel-corner corner-bl" />
      <span className="panel-corner corner-br" />

      <div className="hud-title" style={{ justifyContent: "space-between" }}>
        <span>实时事件流</span>
        <button
          onClick={clearEvents}
          style={{
            background: "none",
            border: "1px solid rgba(255,61,90,0.4)",
            color: "#ff3d5a",
            borderRadius: 3,
            fontSize: 9,
            padding: "1px 6px",
            cursor: "pointer",
            fontFamily: "var(--mono)",
          }}
        >
          清空
        </button>
      </div>

      <div
        ref={boxRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column-reverse",
          gap: 3,
        }}
      >
        {events.length === 0 && (
          <div style={{ color: "#5a6472", fontSize: 10 }}>等待事件…</div>
        )}
        {events.map((line, i) => (
          <div
            key={`${i}-${line.slice(0, 18)}`}
            style={{
              fontSize: 10,
              color: colorOf(line),
              lineHeight: 1.5,
              fontFamily: "var(--mono)",
              wordBreak: "break-all",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
