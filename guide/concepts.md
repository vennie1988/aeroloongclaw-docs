# 核心概念

本节介绍 AeroLoongClaw 的核心架构概念。详细内容请参阅 [架构详解](/reference/architecture)。

## 群组隔离模型

每个群组（Group）在独立隔离的环境中运行：

- **文件系统隔离**：每个群组有独立的 `/workspace/group` 目录
- **会话隔离**：群组间的对话上下文和 session 数据不共享
- **IPC 隔离**：每个群组有独立的 IPC namespace (`/workspace/ipc`)
- **存储隔离**：群组间不共享 media 存储

## 容器生命周期

Agent 在 Docker 容器中隔离执行：

1. **Spawn**：Host 通过 `ContainerRunner` 启动容器
2. **Input**：通过 stdin 传入 `ContainerInput` JSON（prompt、secrets、model、skills）
3. **Execute**：OpenCode Runtime 在容器内运行 agent
4. **Output**：通过 `OUTPUT_START/END` markers 从 stdout 解析结构化结果
5. **IPC**：容器通过文件系统（JSON 文件）向 Host 发送消息/任务/技能事件
6. **Cleanup**：容器在 idle 或超时后退出

## IPC 机制

文件系统-based IPC，原子写入：

```
data/ipc/{group}/
├── messages/     # 容器 → Host 发送消息
├── tasks/        # 定时任务调度
├── input/        # 运行控制（_close 等 sentinel）
└── skills/       # 技能加载事件
```

## 四层指令系统

每个群组有四层 instruction 文件，优先级从高到低：

| 文件 | 用途 | 合并策略 |
|------|------|----------|
| `SOUL.md` | Agent 的核心人格/价值导向 | Override 覆盖 |
| `USER.md` | 用户偏好和使用约束 | Override 覆盖 |
| `AGENTS.md` | Agent 行为规范 | Override 覆盖 |
| `MEMORY.md` | 积累的上下文记忆 | 增量追加 |

## 消息驱动流程

```
用户消息 → Channel → SQLite → Polling Loop → Group Queue
  → Container Runner → Docker 容器 → OpenCode Runtime
  → IPC 文件 → Host IPC Watcher → Router → Channel → 用户
```

## Skills 系统

77+ 运行时技能，分为 4 类：

- **31 built-in skills**：内置于 `skills/` 目录
- **Plugin skills**：来自 knowledge-work-plugins 的可插拔技能
- **Custom skills**：用户通过 `npm run skill:install` 安装

Skills 以 SKILL.md 格式定义，容器内通过 `/workspace/skills/` 只读挂载访问。

## 运行时控制

支持数字回复控制正在运行的 Agent：

| 回复 | 含义 |
|------|------|
| `4` | 查看当前进展 |
| `5` | 停下来 |
| `6` | 从头再来 |

详细说明请参阅 [架构详解](/reference/architecture)。
