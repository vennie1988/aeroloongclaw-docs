# Docker Compose 部署

本文档介绍如何使用 Docker Compose 部署 AeroLoongClaw。

## 快速开始

### 1. 前置条件

- 已安装 Docker 和 Docker Compose
- 已构建 agent 容器镜像（`./container/build.sh`）

### 2. 配置

```bash
git clone <repo>
cd aeroloongclaw

# 复制并编辑环境配置
cp .env.example .env
# 编辑 .env：设置 API_TOKEN、模型 API Key 等
```

`.env` 必填项（用于 HTTP API 模式）：

```bash
API_TOKEN=your-secret-token-here    # HTTP API 鉴权 Bearer token
OPENCODE_MODEL=minimax/MiniMax-M2.7 # 或其他 provider/model
MINIMAX_API_KEY=your-key            # 如果使用 MiniMax
```

### 3. 构建并启动

```bash
# 构建宿主镜像
npm run build
docker compose up -d

# 或从头构建所有内容
docker compose up -d --build
```

### 4. 验证

```bash
curl -H "Authorization: Bearer your-secret-token-here" \
  http://localhost:3200/v1/health
```

预期响应：

```json
{ "status": "ok", "timestamp": "2026-03-24T...", "activeRuns": 0 }
```

### 5. 运行任务

```bash
# 通过 curl
curl -X POST http://localhost:3200/v1/run \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"group":"my-project","prompt":"Analyze this codebase"}'

# 通过 CLI（远程模式）
aeroloongclaw run my-project "Analyze this codebase" \
  --remote http://localhost:3200 \
  --token your-secret-token-here

# 通过 CLI（SSE 流式）
aeroloongclaw run my-project "Deep research on market trends" \
  --remote http://localhost:3200 \
  --token your-secret-token-here \
  --stream
```

## 架构概览

```
┌──────── Docker Compose ────────┐
│                                │
│  aeroloongclaw (host process)  │
│  ├── HTTP API (:3200)          │
│  ├── AgentKernel               │
│  └── Container Runner ─────┐  │
│       (Docker socket)      │  │
│                            v  │
│  aeroloongclaw-agent:latest   │
│  (spawned per task)           │
│                                │
│  Volumes:                      │
│  ├── /app/data (SQLite, IPC)   │
│  ├── /app/logs                 │
│  ├── /app/groups               │
│  └── /var/run/docker.sock      │
└────────────────────────────────┘
```

宿主进程使用 Docker-in-Docker (DinD) 模式来创建 agent 容器。Docker socket 从宿主机挂载，因此 agent 容器与宿主进程并行运行。

## 数据持久化

| 卷挂载 | 用途 |
|--------|------|
| `./data` | SQLite 数据库、IPC 文件、运行时状态 |
| `./logs` | 应用日志（JSON + console 格式） |
| `./groups` | 每个群组的工作区、媒体、指令文件 |

## 部署相关环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `API_TOKEN` | 是 | API 鉴权 Bearer token |
| `API_HOST` | 否 | 绑定地址（默认 `127.0.0.1`，Docker 中需设为 `0.0.0.0`） |
| `API_PORT` | 否 | 端口（默认 `3200`） |
| `OPENCODE_MODEL` | 否 | LLM 模型（默认 `minimax/MiniMax-M2.7`） |
| `CONTAINER_IMAGE` | 否 | Agent 容器镜像（默认 `aeroloongclaw-agent:latest`） |

完整环境变量列表参见 [配置参考](/reference/config)。

## 安全注意事项

- **API_TOKEN** 必须设置，服务器在无 token 时拒绝启动
- 密钥保存在 `.env` 中，通过 stdin JSON 传递给 agent 容器（不挂载文件）
- Docker socket 挂载意味着宿主进程可以控制 Docker daemon，仅在受信任环境中运行
- 默认绑定地址为 `127.0.0.1`（仅本机访问）；设置 `API_HOST=0.0.0.0` 以对外暴露（请确保配置防火墙或反向代理）

## 停止服务

```bash
docker compose down
```

数据保留在挂载的卷中，不会丢失。
