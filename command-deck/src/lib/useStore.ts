// 全局状态：流 / 任务 / 实时事件
import { create } from "zustand";
import { gqlRequest, subscribe, queries, subscriptions, login as apiLogin } from "./gql";
import { DEMO_FLOWS, buildDemoTasks, createDemoEngine } from "./demo";
import type { Flow, Task, ToolCallLog, MessageLog, TerminalLog } from "./types";

export interface DeckState {
  authenticated: boolean;
  demoMode: boolean;
  loginError: string | null;
  loading: boolean;
  flows: Flow[];
  activeFlow: Flow | null;
  tasks: Task[];
  toolCalls: ToolCallLog[];
  messages: MessageLog[];
  terminals: TerminalLog[];
  eventLog: string[]; // HUD 滚动事件流
  unsubs: Array<() => void>;
  demoStop: (() => void) | null;

  login: (email: string, password: string) => Promise<void>;
  loadFlows: () => Promise<void>;
  selectFlow: (flowId: string) => Promise<void>;
  enterDemo: () => void;
  leaveDemo: () => void;
  clearEvents: () => void;
}

let seq = 0;
function pushLog(get: () => DeckState, line: string) {
  const s = get();
  const entry = `[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${line}`;
  // eslint-disable-next-line no-param-reassign
  seq += 1;
  void seq;
  return [entry, ...s.eventLog].slice(0, 200);
}

export const useDeckStore = create<DeckState>((set, get) => ({
  authenticated: false,
  demoMode: false,
  loginError: null,
  loading: false,
  flows: [],
  activeFlow: null,
  tasks: [],
  toolCalls: [],
  messages: [],
  terminals: [],
  eventLog: [],
  unsubs: [],
  demoStop: null,

  login: async (email, password) => {
    try {
      await apiLogin(email, password);
      set({ authenticated: true, loginError: null });
      await get().loadFlows();
    } catch (e) {
      set({ loginError: e instanceof Error ? e.message : "登录失败" });
    }
  },

  loadFlows: async () => {
    // 演示模式下刷新 = 重启演示引擎
    if (get().demoMode) {
      get().demoStop?.();
      const stop = createDemoEngine().start(get, set);
      set({ demoStop: stop });
      return;
    }
    set({ loading: true });
    try {
      const data = await gqlRequest<{ flows: Flow[] }>(queries.flows);
      set({ flows: data.flows, loading: false });
      const active = get().activeFlow;
      if (active) {
        const fresh = data.flows.find((f) => f.id === active.id);
        if (fresh) set({ activeFlow: fresh });
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AuthError") {
        set({ authenticated: false, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },

  selectFlow: async (flowId) => {
    // 清理旧订阅
    get().unsubs.forEach((u) => u());

    // 演示模式：直接载入模拟数据，不请求后端
    if (get().demoMode) {
      const flow = DEMO_FLOWS.find((f) => f.id === flowId) ?? DEMO_FLOWS[0];
      const flowTasks = flowId === "demo-1" ? buildDemoTasks() : [];
      set({
        activeFlow: flow,
        tasks: flowTasks,
        toolCalls: [],
        terminals: [],
        messages: [],
        eventLog: [`[DEMO] Flow「${flow.title}」已载入，${flowTasks.length} 个任务`],
      });
      return;
    }

    const raw = await gqlRequest<{
      flow: Flow;
      tasks: Task[];
      toolCallLogs: ToolCallLog[];
      terminalLogs: TerminalLog[];
    }>(queries.flowDetail, { flowId });

    set({
      activeFlow: raw.flow,
      tasks: raw.tasks,
      toolCalls: raw.toolCallLogs,
      terminals: raw.terminalLogs,
      messages: [],
      eventLog: [`Flow「${raw.flow.title}」已载入，${raw.tasks.length} 个任务`],
    });

    const add = (line: string) => set({ eventLog: pushLog(get, line) });
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<{ taskUpdated: Task }>(
        subscriptions.taskUpdated,
        { flowId },
        (d) => {
          const t = d.taskUpdated;
          set((s) => ({
            tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, ...t, subtasks: t.subtasks ?? x.subtasks } : x)),
          }));
          add(`任务「${t.title}」→ ${t.status}`);
        },
      ),
    );
    unsubs.push(
      subscribe<{ toolCallLogAdded: ToolCallLog }>(
        subscriptions.toolCallAdded,
        { flowId },
        (d) => {
          const t = d.toolCallLogAdded;
          set((s) => ({ toolCalls: [...s.toolCalls, t].slice(-500) }));
          add(`工具 ${t.name} ${t.status} (${t.durationSeconds?.toFixed(1) ?? "-"}s)`);
        },
      ),
    );
    unsubs.push(
      subscribe<{ messageLogAdded: MessageLog }>(
        subscriptions.messageAdded,
        { flowId },
        (d) => {
          const m = d.messageLogAdded;
          set((s) => ({ messages: [...s.messages, m].slice(-200) }));
          if (m.type === "advice" || m.type === "input" || m.type === "ask") {
            add(`Agent: ${m.message.slice(0, 120)}`);
          }
        },
      ),
    );
    unsubs.push(
      subscribe<{ terminalLogAdded: TerminalLog }>(
        subscriptions.terminalAdded,
        { flowId },
        (d) => {
          const t = d.terminalLogAdded;
          set((s) => ({ terminals: [...s.terminals, t].slice(-400) }));
          const text = t.text.trim();
          if (text && t.type !== "stdin") add(`[${t.type}] ${text.slice(0, 100)}`);
        },
      ),
    );
    set({ unsubs });
  },

  enterDemo: () => {
    // 清理真实模式订阅与旧引擎
    get().unsubs.forEach((u) => u());
    get().demoStop?.();
    const flow = DEMO_FLOWS[0];
    const tasks = buildDemoTasks();
    set({
      demoMode: true,
      authenticated: false,
      loginError: null,
      flows: DEMO_FLOWS,
      activeFlow: flow,
      tasks,
      toolCalls: [],
      messages: [],
      terminals: [],
      eventLog: [`[DEMO] 演示模式已启动 — 模拟「${flow.title}」攻击链`],
    });
    const stop = createDemoEngine().start(get, set);
    set({ demoStop: stop });
  },

  leaveDemo: () => {
    get().demoStop?.();
    get().unsubs.forEach((u) => u());
    set({
      demoMode: false,
      demoStop: null,
      flows: [],
      activeFlow: null,
      tasks: [],
      toolCalls: [],
      messages: [],
      terminals: [],
      eventLog: [],
      unsubs: [],
    });
  },

  clearEvents: () => set({ eventLog: [] }),
}));
