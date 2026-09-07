# UpClaw × PentAGI 融合升级说明

> 本仓库已将 [UpClaw](https://github.com/okdkebm/UpClaw)（AI 驱动的单文件渗透测试 CLI，Apache-2.0）作为**一等公民工具**深度集成进 PentAGI 的多智能体渗透引擎，形成"**平台级自主渗透 + 证据级反幻觉扫描**"的融合形态。

## 一、融合后的能力变化

| 维度 | 原 PentAGI | 融合升级后 |
|------|-----------|-----------|
| 扫描方式 | Agent 逐条调度 terminal 命令（nmap/nuclei 等），广度扫描靠 Agent 自行编排 | 新增 `upclaw` 工具：一次调用完成 **Recon → 31 项零依赖内置检测 → 外部工具适配 → 证据链报告** 的全自动闭环 |
| 反幻觉 | 依赖 Agent 自行验证 | UpClaw 内置 Reason→Explore→Fact→Reflect 循环，每个发现（finding）自带原始请求/响应证据，`VERIFIED`/`UNVERIFIED` 分级 |
| 证据留存 | 命令历史 + 报告 | 新增 `trace.json` 全程决策链回放 + per-finding 证据文件，可回灌 LLM 做攻击链推理 |
| 合规门禁 | 依赖人工约束 | UpClaw 授权文件门禁**原样保留**：无 `--auth-file` 且目标不在 scope 内时拒绝执行，Agent 无法绕过 |
| 复用经验 | 向量记忆库 | 扫描结果摘要自动进入记忆存储链路（已加入 `allowedStoringInMemoryTools`） |

## 二、集成架构

```
PentAGI Pentester Agent
        │  调用 upclaw 工具（Go 原生封装）
        ▼
backend/pkg/tools/upclaw.go
        │  1) ensureInstalled：容器内自愈引导（首用时自动部署内嵌 upclaw.py）
        │  2) 组装 CLI（scan/recon/req/cmp/doctor/tools + 合规 --auth-file）
        ▼
Flow 主容器（vxcontrol/kali-linux 或预烘焙镜像）内的 python3 /opt/upclaw/upclaw.py
        │  扫描完成
        ▼
/work/upclaw/<时间戳>/ ── report.html · findings.json · trace.json · evidence/
        │  findings.json 被解析回 Go
        ▼
结构化摘要（严重级计数 + Top 发现 + 修复建议 + 报告路径）返回给 Agent 继续渗透
```

## 三、代码变更清单

| 文件 | 变更 |
|------|------|
| `backend/pkg/tools/upclaw.go` | **新增**：UpClaw 工具实现（自愈引导、命令组装、findings.json 解析摘要） |
| `backend/pkg/tools/upclaw/upclaw.py` | **新增**：内嵌的 UpClaw 单文件脚本（go:embed），连同 LICENSE |
| `backend/pkg/tools/args.go` | **追加**：`UpclawAction` 参数 schema（mode/target/auth_file/timeout 等） |
| `backend/pkg/tools/registry.go` | **注册**：`UpclawToolName` 常量、类型映射、FunctionDefinition、消息类型映射 |
| `backend/pkg/tools/tools.go` | **接线**：`GetPentesterExecutor` 注入 upclaw 工具（Pentester Agent 可直接调用） |
| `docker/upclaw/` | **新增**：预烘焙镜像 Dockerfile + upclaw.py + LICENSE（可选） |

## 四、使用方法

### 1. Agent 侧（Pentester 自动使用）

Pentester Agent 在规划广度扫描时可直接调用：

```json
{
  "mode": "scan",
  "target": "testsite.example.com",
  "auth_file": "/work/upclaw-auth.json",
  "timeout": 3600,
  "message": "用 UpClaw 做一轮全量授权扫描，收集可验证的发现"
}
```

可选参数：`checks`（指定模块子集）、`no_ext`（关闭外部工具阶段）、`nuclei_tags`/`nuclei_severity`（Nuclei 定向）、`ports`/`skip_ports` 等。

`mode=recon` 仅信息收集；`mode=req`/`mode=cmp` 是 Repeater/Comparer 手工包工具；`mode=doctor`/`mode=tools` 做环境自检。

### 2. 授权文件（合规门禁，必需）

扫描/侦察模式必须提供授权文件（容器内路径），格式：

```json
{
  "authorized_by": "目标所有者/授权人",
  "scope": ["testsite.example.com", "192.168.1.0/24"],
  "valid_until": "2026-12-31",
  "reference": "合同编号 / SRC 平台授权记录"
}
```

- 目标不在 `scope` 内 → UpClaw 拒绝执行（PentAGI 侧也无法绕过，这是有意设计）；
- `valid_until` 过期 → 拒绝执行；
- 未提供授权文件时，工具会返回引导信息让 Agent 先用 file 工具创建。

### 3. 部署

**方式 A（零配置，默认可用）**：什么都不用做。`upclaw` 工具首次被调用时自动把内嵌脚本引导（bootstrap）进 flow 容器（要求容器内有 `python3 >= 3.10`，Kali 镜像自带）。

**方式 B（预烘焙镜像）**：

```bash
docker build -t vxcontrol/kali-linux-upclaw:latest -f docker/upclaw/Dockerfile .
# .env 中设置
DOCKER_DEFAULT_IMAGE_FOR_PENTEST=vxcontrol/kali-linux-upclaw:latest
docker compose up -d backend
```

## 五、合规声明

- UpClaw 与本集成的所有扫描能力**仅用于已授权的安全测试**（渗透测试合同、SRC 授权范围、CTF、自有资产）。未经授权扫描在多数司法辖区属违法行为。
- UpClaw 的授权文件门禁在集成中被完整保留并强制执行；PentAGI 侧不提供、也不会提供绕过路径。
- UpClaw 原始许可为 Apache-2.0（商业使用需遵循上游 `website/legal.html` 的商业授权条款）， vendored 副本连同 LICENSE 一并存档于 `backend/pkg/tools/upclaw/` 与 `docker/upclaw/`。
