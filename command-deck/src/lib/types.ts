// PentAGI GraphQL 数据类型（与 backend/pkg/graph/schema.graphqls 对齐）

export type FlowStatus = "created" | "running" | "waiting" | "finished" | "failed";
export type ToolCallStatus = "received" | "running" | "finished" | "failed";

export interface Flow {
  id: string;
  title: string;
  status: FlowStatus;
  provider: { name: string; type: string };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: FlowStatus;
  input: string;
  result: string;
  flowId: string;
  subtasks: Subtask[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  status: FlowStatus;
  title: string;
  description: string;
  result: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCallLog {
  id: string;
  callId: string;
  status: ToolCallStatus;
  name: string;
  args: string;
  result: string;
  durationSeconds: number;
  flowId: string;
  taskId: string | null;
  subtaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageLog {
  id: string;
  type: string;
  message: string;
  result: string;
  flowId: string;
  taskId: string | null;
  subtaskId: string | null;
  createdAt: string;
}

export interface TerminalLog {
  id: string;
  flowId: string;
  taskId: string | null;
  subtaskId: string | null;
  type: "stdin" | "stdout" | "stderr";
  text: string;
  terminal: string;
  createdAt: string;
}

// 状态 → 颜色（3D 节点 + HUD 共用）
export const STATUS_COLOR: Record<string, string> = {
  created: "#4aa8ff",
  running: "#ffb020",
  waiting: "#7a8699",
  finished: "#39ff88",
  failed: "#ff3d5a",
};

// 状态优先级（用于事件聚合排序）
export const STATUS_ORDER: Record<string, number> = {
  failed: 5,
  running: 4,
  waiting: 3,
  created: 2,
  finished: 1,
};
