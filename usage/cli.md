---
title: CLI 命令行工具
description: aeroloongclaw 命令行工具完整参考
---

# CLI 命令行工具

AeroLoongClaw 提供命令行工具 `aeroloongclaw`，支持本地和远程两种模式。

## 安装

```bash
# 全局安装
npm install -g aeroloongclaw

# 或直接使用 npx
npx aeroloongclaw --help
```

---

## aeroloongclaw run

执行 Agent 任务。

### 本地模式

直接启动 AgentKernel，执行完成后返回结果：

```bash
aeroloongclaw run my-project "分析这段代码"
```

### 远程模式

通过 HTTP API 调用远程服务：

```bash
aeroloongclaw run my-project "分析这段代码" \
  --remote http://localhost:3200 --token my-secret
```

### 常用选项

| 选项 | 说明 |
|------|------|
| `--model <model>` | 覆盖默认模型 |
| `--file <path>` | 输入文件（可重复） |
| `--stream` | 启用流式输出（SSE） |
| `--timeout <ms>` | 容器超时 |
| `--isolated` | 不继承会话上下文 |
| `--session <id>` | 恢复指定会话 |
| `--remote <url>` | 远程 API 地址 |
| `--token <token>` | API Bearer token |

### 示例

```bash
# 带文件输入
aeroloongclaw run analysis "分析数据" --file data.csv --file chart.png

# 流式输出
aeroloongclaw run research "深度调研" --stream

# 指定模型
aeroloongclaw run task "翻译" --model anthropic/claude-sonnet-4-6

# 隔离运行
aeroloongclaw run task "独立任务" --isolated

# 带超时
aeroloongclaw run long-task "复杂分析" --timeout 600000
```

---

## aeroloongclaw serve

启动 HTTP API 服务器。

```bash
aeroloongclaw serve --token my-secret --port 3200
aeroloongclaw serve --host 0.0.0.0 --port 8080 --token secret
```

| 选项 | 说明 |
|------|------|
| `--host <host>` | 绑定地址（默认 127.0.0.1） |
| `--port <port>` | 端口（默认 3200） |
| `--token <token>` | Bearer token（必填） |

:::tip
`/metrics` 与 `serve --token` 的关系：
- `--token` 仍只保护 `/v1/*` API
- `/metrics` 默认开放
- 如需保护 `/metrics`，请设置 `METRICS_TOKEN`
:::

---

## aeroloongclaw skills

列出可用 Skills。

```bash
aeroloongclaw skills                              # 本地
aeroloongclaw skills --remote http://api:3200 --token tok  # 远程
```

---

## aeroloongclaw health

健康检查。

```bash
aeroloongclaw health                              # 本地
aeroloongclaw health --remote http://api:3200 --token tok  # 远程
```

---

## aeroloongclaw status

运行时状态快照，包含最近运行指标：

```bash
aeroloongclaw status
```

---

## aeroloongclaw run --stream

SSE 流式输出模式，实时获取执行进度：

```bash
aeroloongclaw run research "深度调研" --stream
```

输出示例：

```
[进度] 正在搜索相关信息...
[进度] 正在分析数据...
[文件生成] report.md
完成！耗时 45.2s
```

---

## 其他子命令

### Service 管理（macOS）

```bash
# 重启服务
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```

### Service 管理（Linux）

```bash
# 重启服务
systemctl --user restart aeroloongclaw

# 停止服务
systemctl --user stop aeroloongclaw

# 查看服务状态
systemctl --user status aeroloongclaw
```

### npm run 命令

项目内常用 npm 脚本：

```bash
npm run wizard        # 交互式设置向导
npm run dev          # 开发模式（热重载）
npm run build        # 编译 TypeScript
npm run typecheck    # 类型检查
npm run doctor       # 系统健康检查
npm run status       # 运行时状态
npm run smoke:setup  # 烟雾测试（无需 Docker/TTY）
```
