# Gen3AGI Command Deck — 3D 攻击态势指挥台

PentAGI 的实时 3D 可视化层：把多 Agent 自主渗透测试的 Flow / Task / Subtask / 工具调用，
渲染为可交互的 **3D 攻击态势星图**，并以 HUD 信息层实时呈现事件流。

## 技术栈

- React 18 + TypeScript + Vite
- Three.js + @react-three/fiber + @react-three/drei（3D 场景）
- graphql-ws（PentAGI GraphQL 实时订阅）
- Zustand（状态管理）
- Docker + nginx（生产部署，反代 PentAGI）

## 架构（方案 A：独立叠加层）

```
┌─────────────────────────────┐
│   Command Deck (port 5173)  │  独立前端，不动 PentAGI 原有代码
│  ┌─────────┐  ┌──────────┐  │
│  │ R3F 3D  │  │  HUD 层  │  │
│  └────┬────┘  └────┬─────┘  │
│       │   zustand  │        │
│       └─────┬──────┘        │
│     GraphQL client (ws+http)│
└─────────────┼───────────────┘
              │ /graphql /auth（代理）
┌─────────────┴───────────────┐
│   PentAGI (8443, 原样保留)   │
│   Flow/Task/订阅/认证        │
└─────────────────────────────┘
```

## 开发模式

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite 代理将 `/graphql` 与 `/auth` 转发到 PentAGI（默认 `https://localhost:8443`，
可用环境变量 `PENTAGI_TARGET` 覆盖）。登录会话沿用 PentAGI 的 cookie（localhost 同 host）。

## 生产部署（Docker）

```bash
docker build -f docker/Dockerfile -t gen3agi/command-deck .
docker run -d -p 8080:80 \
  -e PENTAGI_UPSTREAM=https://pentagi:8443 \
  gen3agi/command-deck
```

或加入 PentAGI 的 docker-compose：

```yaml
  command-deck:
    build: ./command-deck
    ports:
      - "8080:80"
    environment:
      PENTAGI_UPSTREAM: "https://pentagi:8443"
```

## 数据接口（对接 PentAGI GraphQL）

- HTTP：`POST /graphql`（cookie 会话 / Bearer JWT）
- 订阅：`taskUpdated`、`toolCallLogAdded`、`messageLogAdded`、`terminalLogAdded`（按 flowId）

## 目录结构

```
src/
├── lib/        # GraphQL 客户端、类型、store
├── scene/      # 3D 场景：星云、Flow 核心、任务环、子任务簇、事件脉冲
└── hud/        # HUD 层：顶栏、态势面板、事件流、任务链
```

## 许可

MIT。Command Deck 为 Gen3AGI 项目自有代码；对接的 PentAGI（vxcontrol/pentagi）为 MIT 许可。
