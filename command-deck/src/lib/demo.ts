// 演示模式：无 PentAGI 后端时，用模拟数据流驱动同一套 3D 场景与 HUD
import type { Flow, Task, ToolCallLog, TerminalLog } from "./types";
import type { DeckState } from "./useStore";

export const DEMO_FLOWS: Flow[] = [
  {
    id: "demo-1",
    title: "DVWA 授权渗透演练",
    status: "running",
    provider: { name: "deepseek", type: "deepseek" },
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Duck Store 电商渗透",
    status: "finished",
    provider: { name: "openai", type: "openai" },
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 84_000_000).toISOString(),
  },
  {
    id: "demo-3",
    title: "CTF 靶场综合演练",
    status: "waiting",
    provider: { name: "glm", type: "glm" },
    createdAt: new Date(Date.now() - 172_800_000).toISOString(),
    updatedAt: new Date(Date.now() - 170_000_000).toISOString(),
  },
];

export function buildDemoTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: "t1",
      title: "目标侦察 Recon",
      status: "created",
      input: "对 192.168.10.0/24 进行资产侦察",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 300_000).toISOString(),
      updatedAt: new Date(now - 300_000).toISOString(),
      subtasks: [
        { id: "s1", status: "created", title: "子域名枚举", description: "amass/sublist3r", result: "", taskId: "t1", createdAt: new Date(now - 290_000).toISOString(), updatedAt: new Date(now - 290_000).toISOString() },
        { id: "s2", status: "created", title: "端口扫描", description: "nmap -sV", result: "", taskId: "t1", createdAt: new Date(now - 290_000).toISOString(), updatedAt: new Date(now - 290_000).toISOString() },
      ],
    },
    {
      id: "t2",
      title: "Web 指纹识别",
      status: "created",
      input: "识别目标 Web 服务与技术栈",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 280_000).toISOString(),
      updatedAt: new Date(now - 280_000).toISOString(),
      subtasks: [
        { id: "s3", status: "created", title: "HTTP 头分析", description: "curl -I", result: "", taskId: "t2", createdAt: new Date(now - 270_000).toISOString(), updatedAt: new Date(now - 270_000).toISOString() },
        { id: "s4", status: "created", title: "目录爆破", description: "ffuf/gobuster", result: "", taskId: "t2", createdAt: new Date(now - 270_000).toISOString(), updatedAt: new Date(now - 270_000).toISOString() },
      ],
    },
    {
      id: "t3",
      title: "漏洞扫描",
      status: "created",
      input: "nuclei + SQLi 探测",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 260_000).toISOString(),
      updatedAt: new Date(now - 260_000).toISOString(),
      subtasks: [
        { id: "s5", status: "created", title: "nuclei 模板扫描", description: "常见 CVE 检测", result: "", taskId: "t3", createdAt: new Date(now - 250_000).toISOString(), updatedAt: new Date(now - 250_000).toISOString() },
      ],
    },
    {
      id: "t4",
      title: "SQL 注入利用",
      status: "created",
      input: "确认并利用 SQLi 漏洞提取数据",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 240_000).toISOString(),
      updatedAt: new Date(now - 240_000).toISOString(),
      subtasks: [
        { id: "s6", status: "created", title: "sqlmap 自动注入", description: "--batch --dbs", result: "", taskId: "t4", createdAt: new Date(now - 230_000).toISOString(), updatedAt: new Date(now - 230_000).toISOString() },
      ],
    },
    {
      id: "t5",
      title: "权限提升",
      status: "created",
      input: "获取低权 Shell 并尝试提权",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 220_000).toISOString(),
      updatedAt: new Date(now - 220_000).toISOString(),
      subtasks: [
        { id: "s7", status: "created", title: "反弹 Shell", description: "nc -e", result: "", taskId: "t5", createdAt: new Date(now - 210_000).toISOString(), updatedAt: new Date(now - 210_000).toISOString() },
        { id: "s8", status: "created", title: "sudo 提权探测", description: "linpeas", result: "", taskId: "t5", createdAt: new Date(now - 210_000).toISOString(), updatedAt: new Date(now - 210_000).toISOString() },
      ],
    },
    {
      id: "t6",
      title: "Flag 提取与报告",
      status: "created",
      input: "读取 flag 并生成渗透报告",
      result: "",
      flowId: "demo-1",
      createdAt: new Date(now - 200_000).toISOString(),
      updatedAt: new Date(now - 200_000).toISOString(),
      subtasks: [
        { id: "s9", status: "created", title: "读取 flag", description: "cat /root/flag.txt", result: "", taskId: "t6", createdAt: new Date(now - 190_000).toISOString(), updatedAt: new Date(now - 190_000).toISOString() },
      ],
    },
  ];
}

const TOOL_POOL = [
  { name: "nmap", args: "-sV -p 1-65535 192.168.10.11", result: "22/tcp ssh, 80/tcp http, 3306/tcp mysql" },
  { name: "nuclei", args: "-t cves/ -u http://192.168.10.11", result: "CVE-2021-41773 Apache path traversal" },
  { name: "sqlmap", args: "-u http://192.168.10.11/item?id=1 --dbs", result: "dbms: mysql 5.7, dbs: dvwa" },
  { name: "gobuster", args: "dir -u http://192.168.10.11 -w dirs.txt", result: "/config.php, /phpmyadmin" },
  { name: "ffuf", args: "-w params.txt -u http://192.168.10.11/FUZZ", result: "admin, api, upload" },
  { name: "nikto", args: "-h http://192.168.10.11", result: "5 vulnerabilities found" },
  { name: "hydra", args: "-l admin -P rockyou.txt ssh://192.168.10.11", result: "login: admin / pass: admin123" },
  { name: "curl", args: "-X POST -d 'user=admin&pass=admin' http://192.168.10.11/login", result: "HTTP 302 -> /index.php" },
  { name: "linpeas", args: "sh linpeas.sh", result: "sudo -l: /usr/bin/find (NOPASSWD)" },
  { name: "jq", args: ".data | to_entries[]", result: "flag{gen3agi_ctf_demo}" },
];

const TERMINAL_POOL: Array<{ type: TerminalLog["type"]; text: string }> = [
  { type: "stdout", text: "Starting Nmap 7.94 ( https://nmap.org )" },
  { type: "stdout", text: "PORT STATE SERVICE VERSION" },
  { type: "stdout", text: "80/tcp open http Apache httpd 2.4.49" },
  { type: "stderr", text: "WARNING: 1 host seems down" },
  { type: "stdout", text: "[+] SQL injection detected in parameter 'id'" },
  { type: "stdout", text: "Database: dvwa, Table: users" },
  { type: "stderr", text: "ERROR: target is not vulnerable to this payload" },
  { type: "stdout", text: "[+] Flag captured: flag{gen3agi_ctf_demo}" },
];

export interface DemoEngine {
  start: (get: () => DeckState, set: (partial: Partial<DeckState>) => void) => () => void;
}

export function createDemoEngine(): DemoEngine {
  return {
    start(get, set) {
      let tick = 0;
      let taskIdx = 0;
      const interval = setInterval(() => {
        tick += 1;
        const now = new Date().toISOString();
        const log: string[] = [];
        const pushEvent = (line: string) => {
          const s = get();
          log.push(`[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${line}`);
        };

        // 阶段 1：任务状态推进（每 3 tick 一个任务进入 running，2 个 tick 后完成/失败）
        const tasks = get().tasks;
        if (tasks.length && taskIdx < tasks.length) {
          const current = tasks[taskIdx];
          if (tick % 4 === 0 && current.status === "created") {
            set({
              tasks: tasks.map((t) =>
                t.id === current.id
                  ? { ...t, status: "running", updatedAt: now }
                  : t,
              ),
            });
            pushEvent(`任务「${current.title}」→ running`);
          } else if (tick % 4 === 2 && current.status === "running") {
            const failed = Math.random() < 0.12;
            set({
              tasks: get().tasks.map((t) =>
                t.id === current.id
                  ? { ...t, status: failed ? "failed" : "finished", updatedAt: now }
                  : t,
              ),
            });
            pushEvent(`任务「${current.title}」→ ${failed ? "failed" : "finished"}`);
            taskIdx += 1;
          }
        } else if (taskIdx >= tasks.length && tick % 8 === 0) {
          // 一轮结束，重置循环（演示持续运转）
          taskIdx = 0;
          const fresh = buildDemoTasks();
          set({ tasks: fresh, toolCalls: [], terminals: [] });
          pushEvent("演示数据已重置，新一轮攻击链开始");
        }

        // 阶段 2：工具调用事件（每 tick 0-1 个）
        if (Math.random() < 0.7) {
          const tool = TOOL_POOL[Math.floor(Math.random() * TOOL_POOL.length)];
          const running: ToolCallLog = {
            id: `d-tc-${tick}-${Math.random().toString(36).slice(2, 6)}`,
            callId: `call_${tick}`,
            status: "running",
            name: tool.name,
            args: tool.args,
            result: "",
            durationSeconds: 0,
            flowId: "demo-1",
            taskId: null,
            subtaskId: null,
            createdAt: now,
            updatedAt: now,
          };
          set({ toolCalls: [...get().toolCalls, running].slice(-500) });
          pushEvent(`工具 ${tool.name} running (${tool.args.slice(0, 60)})`);

          // 下个 tick 完成
          setTimeout(() => {
            const done: ToolCallLog = {
              ...running,
              status: Math.random() < 0.1 ? "failed" : "finished",
              result: tool.result,
              durationSeconds: Number((0.4 + Math.random() * 3).toFixed(1)),
              updatedAt: new Date().toISOString(),
            };
            set({
              toolCalls: get().toolCalls.map((tc) =>
                tc.id === done.id ? done : tc,
              ),
            });
          }, 1000 + Math.random() * 1800);
        }

        // 阶段 3：终端输出
        if (Math.random() < 0.5) {
          const t = TERMINAL_POOL[Math.floor(Math.random() * TERMINAL_POOL.length)];
          set({
            terminals: [
              ...get().terminals,
              {
                id: `d-term-${tick}`,
                flowId: "demo-1",
                taskId: null,
                subtaskId: null,
                type: t.type,
                text: t.text,
                terminal: "agent-kali-01",
                createdAt: now,
              } as TerminalLog,
            ].slice(-400),
          });
          if (t.type !== "stdin") pushEvent(`[${t.type}] ${t.text.slice(0, 100)}`);
        }

        if (log.length) {
          set({
            eventLog: [...log.reverse(), ...get().eventLog].slice(0, 200),
          });
        }
      }, 1400);

      return () => clearInterval(interval);
    },
  };
}
