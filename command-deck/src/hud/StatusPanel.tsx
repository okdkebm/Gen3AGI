import { useMemo } from "react";
import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR, STATUS_ORDER } from "../lib/types";

export function StatusPanel() {
  const tasks = useDeckStore((s) => s.tasks);
  const toolCalls = useDeckStore((s) => s.toolCalls);
  const terminals = useDeckStore((s) => s.terminals);
  const activeFlow = useDeckStore((s) => s.activeFlow);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let done = 0;
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      if (t.status === "finished") done += 1;
    }
    const doneCalls = toolCalls.filter((c) => c.status === "finished" || c.status === "failed").length;
    const runningCalls = toolCalls.filter((c) => c.status === "running" || c.status === "received").length;
    const stderr = terminals.filter((t) => t.type === "stderr").length;
    return { byStatus, done, total: tasks.length, doneCalls, runningCalls, stderr };
  }, [tasks, toolCalls, terminals]);

  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div
      className="hud-panel"
      style={{ top: 76, left: 14, width: 230, zIndex: 10 }}
    >
      <span className="panel-corner corner-tl" />
      <span className="panel-corner corner-tr" />
      <span className="panel-corner corner-bl" />
      <span className="panel-corner corner-br" />

      <div className="hud-title">作战态势</div>
      <div style={{ padding: "10px 12px", display: "grid", gap: 10 }}>
        {/* 任务进度 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "#8a94a6" }}>TASK PROGRESS</span>
            <span style={{ color: "#39ff88" }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: "rgba(138,148,166,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #00e5ff, #39ff88)",
                boxShadow: "0 0 8px rgba(57,255,136,0.6)",
                transition: "width 0.5s",
              }}
            />
          </div>
        </div>

        {/* 任务状态分布 */}
        <div style={{ display: "grid", gap: 4 }}>
          {(Object.keys(STATUS_ORDER) as string[])
            .map((st) => ({ st, n: stats.byStatus[st] ?? 0 }))
            .filter((x) => x.n > 0)
            .sort((a, b) => STATUS_ORDER[a.st] - STATUS_ORDER[b.st])
            .map(({ st, n }) => (
              <div key={st} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: STATUS_COLOR[st] }}>▮ {st.toUpperCase()}</span>
                <span style={{ color: "#8a94a6" }}>{n}</span>
              </div>
            ))}
          {Object.keys(stats.byStatus).length === 0 && (
            <span style={{ color: "#5a6472", fontSize: 10 }}>等待任务数据…</span>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(0,229,255,0.15)" }} />

        {/* 工具调用统计 */}
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ color: "#8a94a6" }}>工具调用</span>
            <span style={{ color: "#c8d0de" }}>{toolCalls.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ color: "#8a94a6" }}>执行中</span>
            <span style={{ color: "#ffb020" }}>{stats.runningCalls}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ color: "#8a94a6" }}>已完成</span>
            <span style={{ color: "#39ff88" }}>{stats.doneCalls}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
            <span style={{ color: "#8a94a6" }}>STDERR 行数</span>
            <span style={{ color: stats.stderr > 0 ? "#ff3d5a" : "#8a94a6" }}>{stats.stderr}</span>
          </div>
        </div>

        {activeFlow && (
          <div style={{ fontSize: 9, color: "#5a6472", lineHeight: 1.5, borderTop: "1px solid rgba(0,229,255,0.1)", paddingTop: 8 }}>
            FLOW ID: {activeFlow.id}
            <br />
            CREATED: {new Date(activeFlow.createdAt).toLocaleString("zh-CN", { hour12: false })}
          </div>
        )}
      </div>
    </div>
  );
}
