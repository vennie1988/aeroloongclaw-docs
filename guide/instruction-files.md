---
title: 指令文件详解
description: SOUL.md、USER.md、AGENTS.md、MEMORY.md 四层指令系统
---

# 指令文件详解

AeroLoongClaw 为每个群组维护四层长期指令文件，分别对应不同的职责层级。四层文件在磁盘上独立存放，运行时由 OpenCode Runner 按优先级合并后加载。

## 四层文件角色

| 文件 | 用途 | 内容示例 | 建议行数 |
|------|------|----------|----------|
| `SOUL.md` | 核心人格与行事风格 | 价值观、语气、说话方式 | ≤ 50 行 |
| `USER.md` | 用户偏好与协作方式 | 称呼、语言、输出格式偏好 | ≤ 50 行 |
| `AGENTS.md` | 运行规则与工具纪律 | 工具调用规范、安全边界、记忆写入协议 | ≤ 150 行 |
| `MEMORY.md` | 长期积累的事实与决策 | 项目背景、已确认结论、反复出现的需求 | ≤ 100 行 |

::: tip 四层文件的分工原则
- `SOUL.md`：很少变动，定义"我是谁"
- `USER.md`：偶尔更新，记录"用户喜欢什么"
- `AGENTS.md`：很少变动，规定"我怎么做"
- `MEMORY.md`：主动维护，记录"我知道什么"
:::

## 文件位置

### 群组本地文件

```
groups/{group}/
├── SOUL.md      # 群组人格覆盖
├── USER.md      # 群组用户偏好覆盖
├── AGENTS.md    # 群组运行规则覆盖
└── MEMORY.md    # 群组长期记忆（增量追加）
```

### 全局默认文件

```
/workspace/global/          # 容器内全局工作区
├── SOUL.md      # 不使用（SOUL 不可全局）
├── USER.md      # 不使用（USER 不可全局）
├── AGENTS.md    # 全局共享规则，所有群组继承
└── MEMORY.md    # 全局长期记忆，所有群组共享
```

::: note
全局目录在容器内为 `/workspace/global/`；Host 端对应目录由容器挂载决定。
:::

## 合并策略

四层文件采用两种不同的合并策略：

### 覆盖策略（Override）— SOUL / USER / AGENTS

```
群组文件存在 → 加载群组文件
群组文件不存在 → 加载全局文件（作为后备）
```

对于 SOUL.md、USER.md、AGENTS.md，同一时间只加载一份文件（群组优先，全局兜底）。

### 增量追加策略（Additive）— MEMORY

```
1. 先加载全局 MEMORY.md
2. 再加载群组 MEMORY.md
```

全局记忆和群组记忆都会被保留，按顺序拼接。适合记录跨群组成立的通用事实和仅在当前群组有效的特定上下文。

### 合并流程图

```
开始加载指令
     │
     ├─► SOUL.md   ──群组存在?──是──► 加载群组版本
     │                    │
     │                    否
     │                    ▼
     │              加载全局版本（若有）
     │
     ├─► USER.md   ──群组存在?──是──► 加载群组版本
     │                    │
     │                    否
     │                    ▼
     │              加载全局版本（若有）
     │
     ├─► AGENTS.md ──群组存在?──是──► 加载群组版本
     │                    │
     │                    否
     │                    ▼
     │              加载全局版本（若有）
     │
     └─► MEMORY.md ──► 加载全局版本 ──► 加载群组版本（两者都加载）
```

## 优先级链

四层文件的加载顺序（对应优先级从高到低）：

```
SOUL.md  →  USER.md  →  AGENTS.md  →  MEMORY.md
（人格）    （偏好）     （规则）       （记忆）
```

::: warning 优先级仅影响加载顺序，不影响覆盖语义
对于 SOUL/USER/AGENTS，同一层级不会同时存在两份（群组覆盖全局）。对于 MEMORY，全局和群组都会保留（增量追加）。
:::

## 实际加载顺序

当 OpenCode 加载指令时，文件按以下顺序读入（最终决定运行时可见内容）：

1. `SOUL.md`（群组或全局后备）
2. `USER.md`（群组或全局后备）
3. `AGENTS.md`（群组或全局后备）
4. `MEMORY.md`（全局 + 群组拼接）
5. `.opencode/instructions.md`（运行时生成的汇总指令）
6. `.opencode/interaction-workflow.md`（交互工作流规范）
7. `.opencode/skills-index.md`（技能索引，若有）

## `.opencode/` 运行时资产

四层指令文件在容器启动时会被写入 `.opencode/` 目录，作为 OpenCode 的指令来源：

```
/workspace/group/.opencode/
├── instructions.md       # 四层指令汇总（由运行时写入）
├── interaction-workflow.md  # 交互工作流规范
├── skills-index.md       # 技能索引（由 skills-loader 生成）
├── agents/               # Agent 模板（从 agent-templates/ 复制）
│   ├── build.md
│   ├── planner.md
│   ├── researcher.md
│   ├── executor.md
│   └── reviewer.md
├── commands/             # Command 模板（从 command-templates/ 复制）
│   ├── complex-plan.md
│   ├── complex-research.md
│   ├── complex-execute.md
│   └── complex-review.md
├── skills/               # 技能符号链接 → /workspace/skills/<name>
├── plugins/              # 插件预留目录
└── reload.json           # 资产生成元数据
```

### 资产生成时机

`.opencode/` 资产在容器启动时由 `writeNativeOpenCodeAssets()` 生成（`opencode-native-assets.ts:330`），条件为 `nativeAssetsEnabled !== false`（默认启用）。

### instructions.md 生成逻辑

`instructions.md` 的内容并非简单拼接四层文件，而是：

1. 读取 `SOUL.md`（群组或全局）
2. 读取 `USER.md`（群组或全局）
3. 读取 `AGENTS.md`（群组或全局）
4. 读取 `MEMORY.md`（全局 + 群组，按序拼接）
5. 拼接为单个字符串，写入 `.opencode/instructions.md`

该文件路径通过 `opencode.json` 的 `instructions` 字段注册到 OpenCode（`opencode-config.ts:120`）。

## 主群组与普通群组的差异

| 文件 | 主群组（Main） | 普通群组 |
|------|----------------|----------|
| `SOUL.md` | 独立人格 | 独立人格 |
| `USER.md` | 主协作者信息 | 群组用户偏好 |
| `AGENTS.md` | 包含主控线程额外权限章节 | 常规运行规则 |
| `MEMORY.md` | 全局长期记忆 | 群组长期记忆 |

主群组的 `AGENTS.md` 包含额外的「主控制线程权限」章节，授予注册群组、管理技能、配置挂载等能力。

## 更新时机建议

| 文件 | 何时更新 | 更新频率 |
|------|----------|----------|
| `SOUL.md` | 人格或风格发生根本性变化 | 很低 |
| `USER.md` | 发现用户新的稳定偏好 | 低 |
| `AGENTS.md` | 运行规则需要调整 | 很低 |
| `MEMORY.md` | 有价值跨会话事实、确认的决策 | 中 |

::: tip 写入 MEMORY.md 的判断标准
- 跨会话都有价值的事实
- 用户明确要求"记住这个"
- 任务结束时产生了未来会用到的新认知
:::

::: danger 不应写入 MEMORY.md 的内容
- 当前任务的临时过程、中间草稿
- 已能从文件推导出的信息
- 不确定是否长期有效的猜测
- 用户偏好（应写入 USER.md）
:::

## 相关文档

- [核心概念](./concepts.md) — 四层指令系统的概述
- [架构详解](/reference/architecture.md) — 容器内运行时完整流程
- [MCP 工具参考](/reference/mcp-tools) — 定时任务调度工具 `schedule_task` 等完整列表
