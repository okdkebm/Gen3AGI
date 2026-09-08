<div align="center">

# 🛰️ Gen3AGI — 3D 攻击态势指挥台 × AI 自主渗透测试

**把 AI 渗透测试的全过程，变成一场可交互的 3D 战场。**

</div>

<br/>

**Gen3AGI** 以 [PentAGI](https://github.com/vxcontrol/pentagi)（MIT）多 Agent 自主渗透测试平台为基座，
新增了一套独立的 **3D 攻击态势指挥台（Command Deck）**：Flow 是恒星，Task 是轨道上的行星，
每一次工具调用都是一道划过星空的冲击波——AI Agent 在终端里做了什么，一屏尽收眼底。

> ⚡ 无需部署 PentAGI 即可体验：打开页面 → 点击「**体验演示模式（免部署）**」，模拟攻击链实时驱动整套 3D 场景。

<br/>

## ✨ 核心亮点

| | 亮点 | 说明 |
|---|---|---|
| 🌌 | **3D 可视化优先** | 攻击过程渲染为交互式星图（Flow 核心 / 任务轨道 / 子任务簇 / 工具调用冲击波），不是聊天框 |
| ⚡ | **实时事件驱动** | 直连 PentAGI GraphQL 订阅（`taskUpdated` / `toolCallLogAdded` / `messageLogAdded` / `terminalLogAdded`），秒级上屏 |
| 🎮 | **HUD 作战面板** | 顶栏态势 / 任务进度 / 实时事件流 / 攻击链时间线，工程蓝图风格暗色 UI |
| 🧪 | **演示模式** | 内置模拟攻击链引擎（Recon → 指纹 → 扫描 → 注入 → 提权 → Flag），无后端也能全功能展示 |
| 🧱 | **独立叠加层架构** | 零 fork 上游：PentAGI 上游可随时 merge，Command Deck 独立演进 |
| 🐳 | **一键部署** | Docker + nginx 反代（`/graphql` `/auth`），与 PentAGI 并存于同一 compose |

<br/>

## 🏗️ 仓库结构

```
Gen3AGI
├── command-deck/          ★ Gen3AGI 自有代码：3D 指挥台（React18 + TS + R3F）
│   ├── src/scene/         3D 星图场景（星云/Flow核心/任务环/子任务簇/事件脉冲）
│   ├── src/hud/           HUD 层（顶栏/态势面板/事件流/任务链/登录页）
│   ├── src/lib/           GraphQL 客户端（HTTP + graphql-ws 订阅）+ 状态 + 演示引擎
│   └── docker/            生产镜像（nginx 反代 PentAGI）
├── README.pentagi.md      上游 PentAGI 完整文档（保留）
└── ...                    PentAGI 基座代码（MIT，可随时同步上游）
```

<br/>

## 🚀 快速开始

### 体验演示模式（30 秒，无需任何依赖）

```bash
cd command-deck
npm install
npm run dev          # 打开 http://localhost:5173 → 点击「体验演示模式」
```

### 连接真实 PentAGI

```bash
# 1. 先部署 PentAGI（见 README.pentagi.md Quick Start，Docker 一键）
# 2. 启动指挥台（Vite 代理自动转发 /graphql /auth 到 https://localhost:8443）
npm run dev
# 3. 使用 PentAGI 账号登录，选择 Flow 即进入实时 3D 态势
```

### Docker 生产部署

```bash
cd command-deck
docker build -f docker/Dockerfile -t gen3agi/command-deck .
docker run -d -p 8080:80 -e PENTAGI_UPSTREAM=https://pentagi:8443 gen3agi/command-deck
```

<br/>

## 🏛️ 架构

```
┌──────────────────────────────────────┐
│  Command Deck (独立前端，port 5173/80)│
│  ┌───────────┐      ┌─────────────┐  │
│  │ R3F 3D    │      │  HUD 信息层 │  │
│  │ 星图场景   │      │  4 作战面板  │  │
│  └─────┬─────┘      └──────┬──────┘  │
│        └───── zustand ─────┘         │
│        GraphQL client (http+ws)      │
└──────────────┬───────────────────────┘
               │ /graphql /auth（代理，cookie 会话）
┌──────────────┴───────────────────────┐
│  PentAGI（原样保留，port 8443）        │
│  多 Agent 编排 · Docker 沙箱 · 记忆   │
└──────────────────────────────────────┘
```

<br/>

## 🗺️ 路线图

- [x] **v0.1** 3D 指挥台 + 演示模式（当前）
- [ ] **v0.2** 真实数据联调、Flow 多目标对比视图
- [ ] **v1.0** CTF 靶场场景插件（DVWA / Duck Store 一键演练）
- [ ] **v1.x** Web 资产测绘视图（subfinder / httpx / nuclei 融合）
- [ ] **v2.0** AI 应用安全模块

<br/>

## 📜 许可与致谢

- Gen3AGI 自有代码（`command-deck/`）：**MIT**
- 基座 PentAGI：[vxcontrol/pentagi](https://github.com/vxcontrol/pentagi)（MIT）

> ⚠️ **合规声明**：本工具仅限用于**已获授权**的渗透测试、CTF 与安全教育。未授权扫描目标在多数司法辖区属于违法行为。
