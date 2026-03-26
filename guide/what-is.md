---
title: 什么是 AeroLoongClaw
description: 了解 AeroLoongClaw 多模型 AI 员工平台的核心概念、三种使用模式和架构概览。
---

# 什么是 AeroLoongClaw

AeroLoongClaw 是一个**多模型 AI 员工平台**：接收来自消息渠道的工作请求，在隔离的 Docker 容器里运行 AI 员工，再把结果发回给用户。

它不是一个简单的聊天机器人框架，而是一个面向企业场景的 AI 员工运行时 -- 每个 AI 员工拥有独立的工作空间、记忆、文件系统和工具集，像真正的员工一样执行复杂任务。

## 三种使用模式

AeroLoongClaw 提供三种使用方式，覆盖从即时通讯到程序化调用的全部场景：

### 消息驱动模式

通过企业微信、Web UI 等渠道发送消息，AI 员工自动接收并处理。适合日常工作协作。

```
用户 → @Andy 帮我分析这份报告 → 企业微信/Web UI → AI 员工处理 → 结果回复
```

### 程序化调用模式

上层应用直接调用 `AgentKernel.run()` API，将 AI 员工能力集成到自有系统中。

```typescript
import { AgentKernel } from 'aeroloongclaw/core'

const kernel = new AgentKernel()
const result = await kernel.run('my-project', '分析代码质量', {
  files: ['report.pdf'],
  model: 'anthropic/claude-sonnet-4-20250514'
})
```

### HTTP API / CLI 模式

通过 REST API 或命令行工具访问 AI 员工能力，适合自动化流水线和远程调用。

```bash
# CLI 模式
aeroloongclaw run my-group "生成本周工作总结"

# HTTP API
curl -X POST http://localhost:3100/api/run \
  -H "Authorization: Bearer <token>" \
  -d '{"group": "my-group", "prompt": "生成本周工作总结"}'
```

## 核心特性

### 容器隔离

每个 AI 员工运行在独立的 Docker 容器中，拥有：

- 独立的文件系统（`/workspace/group`）
- 隔离的 IPC 通信通道
- 独立的会话状态和记忆
- 只读的 Skill 挂载

群组之间完全隔离，无法互相访问数据。

### 多模型支持

支持主流 AI 模型提供商，通过环境变量一键切换：

| 提供商 | 模型示例 |
|--------|---------|
| MiniMax | MiniMax-M2.7（默认） |
| Anthropic | Claude Sonnet / Opus |
| OpenAI | GPT-4o |
| Google | Gemini |

### 消息渠道

自注册的渠道系统，按需启用：

- **Web UI** -- 内置 Web 界面，开箱即用
- **企业微信** -- 深度集成，支持群聊和私聊
- 更多渠道可通过插件扩展

### 运行时 Skill 系统

77 个预置 Skill（31 个内置 + 插件生态），涵盖：

- 浏览器操作、代码调试、定时任务
- 知识工作插件（来自 ClawHub 生态）
- 支持从 GitHub 安装自定义 Skill

## 架构概览

AeroLoongClaw 由两个独立进程组成：

```
┌─────────────────────────────────┐    stdin JSON     ┌──────────────────────────────┐
│  宿主进程 (Host Process)         │ ───────────────>  │  容器进程 (Container Process) │
│                                 │                   │                              │
│  消息渠道 → SQLite → 轮询循环    │                   │  OpenCode Runtime            │
│  群组队列 → 容器调度             │                   │  Session Supervisor          │
│  IPC 监听 → 路由回复             │  <── IPC 文件 ──  │  IPC MCP 工具               │
└─────────────────────────────────┘                   └──────────────────────────────┘
```

**数据流简述**：

1. 用户通过渠道发送消息，存入 SQLite
2. 轮询循环检测到新消息，匹配触发词，加入群组队列
3. 容器调度器启动 Docker 容器，通过 stdin 传入任务
4. 容器内 AI 员工执行任务，通过 IPC 文件系统写回结果
5. 宿主进程的 IPC 监听器检测到结果，路由回消息渠道

复杂任务会自动走 native-agent 流水线：规划 → 调研 → 审批 → 执行 → 审查。

## 适用场景

AeroLoongClaw 适合以下场景和用户：

- **企业团队** -- 需要 AI 员工处理日常工作任务（文档生成、数据分析、代码审查）
- **开发者** -- 需要将 AI 能力集成到自有产品中
- **运维团队** -- 需要自动化运维任务和监控
- **个人用户** -- 需要一个强大的私有 AI 助手

::: tip 下一步
准备好开始了吗？前往 [快速开始](./getting-started) 在 5 分钟内运行你的第一个 AI 员工。
:::
