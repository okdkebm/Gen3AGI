# Gen3AGI

**Gen3AGI** — 第三代 AI 渗透测试引擎：将 **PentAGI**（多智能体自主渗透平台）与 **UpClaw**（证据级反幻觉扫描 CLI）深度融合，一个平台同时具备"平台级自主编排"与"单文件零依赖深度扫描"两种能力。

> ⚠️ **仅限已授权的安全测试。** 未经书面授权扫描目标在多数司法辖区属违法行为。UpClaw 授权文件门禁在集成中原样保留并强制执行。

## 架构速览

```
PentAGI Pentester Agent
   │  调用 upclaw 工具（Go 一等公民工具，非 shell 拼凑）
   ▼
backend/pkg/tools/upclaw.go
   │  1) 自愈引导：容器内首用自动部署内嵌 upclaw.py（go:embed）
   │  2) 合规门禁：--auth-file 授权范围校验（不可绕过）
   ▼
Flow 容器内执行 UpClaw 全自动扫描
   │  Recon → 31 项零依赖检测 → 外部工具适配（nuclei/sqlmap/...）→ 证据链报告
   ▼
findings.json 解析回结构化摘要 → Agent 继续定向利用
   + report.html / trace.json（决策链回放，可回灌 LLM）
```

## 融合带来的能力

| 能力 | 说明 |
|------|------|
| 广度扫描一次到位 | `upclaw scan` 一次调用完成 Recon + 31 项内置检测 + 外部工具编排 |
| 证据级反幻觉 | 每条 finding 带原始请求/响应证据，VERIFIED/UNVERIFIED 分级 |
| 决策链回放 | `trace.json` 记录完整决策链，审计友好、可回灌 LLM 做攻击链推理 |
| Repeater/Comparer | `req`/`cmp` 手工改包与响应对比，原生融入 Agent 工具集 |
| 合规不可绕过 | 无授权文件或目标越界即拒绝执行，Agent 无旁路 |
| 零配置部署 | 默认镜像即可用（自愈引导），可选预烘焙镜像省去首次引导 |

## 部署

```bash
# 方式 A：零配置（默认）——无需任何额外操作
docker compose up -d

# 方式 B：预烘焙 UpClaw 镜像
docker build -t vxcontrol/kali-linux-upclaw:latest -f docker/upclaw/Dockerfile .
echo "DOCKER_DEFAULT_IMAGE_FOR_PENTEST=vxcontrol/kali-linux-upclaw:latest" >> .env
docker compose up -d backend
```

授权文件（Agent 侧 `upclaw` 工具必填参数）：
```json
{
  "authorized_by": "目标所有者",
  "scope": ["example.com", "192.168.1.0/24"],
  "valid_until": "2026-12-31",
  "reference": "合同编号 / SRC 授权记录"
}
```

完整集成细节见 [UPCLAW_FUSION.md](./UPCLAW_FUSION.md)。

## 上游与许可

本项目由两个开源项目融合而成：

| 项目 | 上游 | 许可 | 说明 |
|------|------|------|------|
| PentAGI | [vxcontrol/pentagi](https://github.com/vxcontrol/pentagi) | MIT | 多智能体自主渗透测试平台（Go + React），本仓库保留其完整 LICENSE 与 EULA |
| UpClaw | [okdkebm/UpClaw](https://github.com/okdkebm/UpClaw) | Apache-2.0 | AI 驱动的单文件渗透测试 CLI，vendored 副本附 LICENSE 存放于 `backend/pkg/tools/upclaw/` 与 `docker/upclaw/` |

## 授权使用

**授权安全测试、CTF、安全教育与红队演练专用。** 使用者须自行确保每个目标的测试授权。
