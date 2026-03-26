---
title: MCP 工具参考
description: 容器内 Agent 可调用的 MCP 工具完整列表
---

# MCP 工具参考

AeroLoongClaw 在容器内运行一个 [MCP](https://modelcontextprotocol.io/) Stdio 服务器（`container/agent-runner/src/ipc-mcp-stdio.ts`），向容器内的 Agent 暴露 IPC 工具。Agent 通过这些工具与宿主机通信，实现消息发送、任务调度、技能管理、授权审计等功能。

生成类工具（语音、图像、视频、音乐）已移至 `mcp__MiniMaxGeneration__` 系列工具。

## 消息 (Messaging)

| 工具名称 | 说明 |
|---------|------|
| `send_message` | 向当前会话发送文字消息、媒体文件或带发送者身份的消息 |

## 任务调度 (Task Scheduling)

| 工具名称 | 说明 |
|---------|------|
| `schedule_task` | 创建定时或周期任务，支持 cron 表达式、间隔时间和一次性调度 |
| `list_tasks` | 列出当前会话可见的所有已调度任务 |
| `pause_task` | 暂停一个已调度的任务 |
| `resume_task` | 恢复一个已暂停的任务 |
| `cancel_task` | 取消并删除一个已调度的任务 |

## 技能管理 (Skills)

| 工具名称 | 说明 |
|---------|------|
| `list_installed_skills` | 列出宿主机当前已安装的所有运行时技能 |
| `install_skill` | 从 ClawHub 或 GitHub 安装运行时技能 |
| `promote_local_skill` | 将容器内 `/workspace/group` 下的本地技能草稿提升为宿主机运行时技能 |
| `remove_skill` | 从宿主机移除已安装的运行时技能 |
| `disable_skill` | 禁用已安装的运行时技能（记录审计日志，支持回滚） |
| `rollback_skill_change` | 回滚最近一次技能变更 |
| `search_skills` | 在 SkillHub 注册表中搜索可安装的技能 |

## 授权管理 (Authorization)

| 工具名称 | 说明 |
|---------|------|
| `authorize_sender` | 授权一个企业微信发件人 |
| `authorization_status` | 查看当前授权策略和最近审计事件快照 |
| `restore_default_authorization_policy` | 恢复默认授权策略（自动允许，后审计） |

## 插件管理 (Plugins)

| 工具名称 | 说明 |
|---------|------|
| `install_plugin` | 从 GitHub 安装 Anthropic Knowledge Work 插件 |
| `list_plugins` | 列出所有已安装的插件及其关联技能 |
| `remove_plugin` | 移除已安装的插件及其所有关联技能 |

## 多模态 (Multimodal)

:::note
语音、图像、视频生成工具已从 IPC MCP 中移除，改用 `mcp__MiniMaxGeneration__` 系列工具：

- `mcp__MiniMaxGeneration__text_to_audio` — 语音合成
- `mcp__MiniMaxGeneration__text_to_image` — 图像生成
- `mcp__MiniMaxGeneration__generate_video` — 视频生成
- `mcp__MiniMaxGeneration__music_generation` — 音乐生成

:::

| 工具名称 | 说明 |
|---------|------|
| `generate_music` | 生成歌词并调用音乐生成（`auto_lyrics` 参数可自动从 prompt 生成歌词） |

## 群组与会话 (Group & Session)

| 工具名称 | 说明 |
|---------|------|
| `register_group` | 注册一个新群组，使 Agent 能够响应该群组的消息 |
| `reset_session` | 重置当前会话上下文，清空对话历史（长期文件 `AGENTS.md`、`SOUL.md`、`USER.md`、`MEMORY.md` 会被保留） |

## 工具调用约定

所有工具均通过 MCP stdio 传输调用。Agent 传入参数后，结果以异步事件返回（消息会通过 IPC 写入宿主机文件，宿主机处理完毕后再通过 IPC 响应）。

### 通用参数

大多数工具无需显式参数，直接调用即可。部分工具需要指定目标群组或资源名称。

### IPC 写文件原子性

工具向 `/workspace/ipc/` 目录写入 JSON 文件时，使用 `临时文件 → rename` 的原子写入模式，并注入 `_writtenAt` 时间戳供宿主机测量 IPC 延迟。

## 相关文档

- [配置参考](./config) — 环境变量完整列表
- [Skills 技能系统](../usage/skills) — 运行时技能使用指南
- [多模态能力](../usage/multimodal) — MiniMax 生成工具说明
