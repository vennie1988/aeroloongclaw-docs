---
title: 健康检查与诊断
description: npm run doctor、wecom:doctor、smoke:setup 等运维命令详解
---

# 健康检查与诊断

AeroLoongClaw 提供一组运维命令，用于检查系统健康状态、排查故障、验证部署完整性。所有命令均无需 Docker 或 TTY，可直接在本地运行。

[[toc]]

## npm run doctor — 系统健康检查

`npm run doctor` 是 AeroLoongClaw 的主诊断命令，执行核心系统预检，覆盖服务状态、容器运行时、路径权限、模型凭证、渠道配置、数据库、运行时快照及插件 MCP。

```bash
npm run doctor          # 人类可读输出
npm run doctor -- --json  # JSON 格式输出（便于程序解析）
```

### 输出格式

```
总体状态: ok|warn|error|unknown
✓ service    服务运行中（launchd）
✓ container_runtime    Docker runtime 可达
✓ path.env_file    路径可用: /path/to/.env
...
```

- **总体状态**优先级：`error > warn > unknown > ok`
- 任意一项 `error` 会导致命令以退出码 1 退出

### 检查项详解

#### service — 服务状态

通过系统服务管理器检测 AeroLoongClaw 服务是否在运行。

| 检测到的状态 | 含义 |
|---|---|
| `running` | 服务正常运行中 |
| `stopped` | 服务已安装但当前未运行 |
| `not_found` | 未检测到已安装的服务 |
| `crash_looping` | 服务反复崩溃后被 launchd 重新启动（macOS） |
| `unknown` | 无法确认服务状态 |

支持三种检测方式：macOS `launchd`、Linux `systemd`、PID 文件（降级方案）。

**常见故障与修复：**

| 症状 | 修复方法 |
|---|---|
| 服务未安装 | 运行 `npm run wizard` 完成初始化后重新安装服务 |
| 服务停止 | macOS: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aeroloongclaw.plist`<br>Linux: `systemctl --user start aeroloongclaw` |
| crash_looping | 检查日志 `logs/aeroloongclaw.log` 是否有持续错误；常见原因包括端口被占用、.env 配置错误 |

#### container_runtime — 容器运行时

检测 Docker CLI 或 Apple Container CLI 是否可用，并验证 daemon 连通性。

| 状态 | 含义 |
|---|---|
| `ok` (Apple Container) | 检测到 Apple Container CLI |
| `ok` (Docker) | Docker daemon 可达 |
| `warn` | 检测到 Docker CLI 但 daemon 不可达（服务可能未启动） |

```bash
# 常见修复：启动 Docker Desktop 或 dockerd
docker info          # 验证 daemon 连通性
```

#### path.* — 运行时路径检查

检查关键路径（`.env`、各数据目录、allowlist 文件）是否存在且可读写。

| 检查项 | 路径 |
|---|---|
| `path.env_file` | `.env` 配置文件 |
| `path.store_dir` | SQLite 数据库目录（`store/`） |
| `path.data_dir` | 数据目录（`data/`） |
| `path.groups_dir` | 群组工作区目录（`groups/`） |
| `path.logs_dir` | 日志目录（`logs/`） |
| `path.custom_skills_dir` | 自定义技能目录（`.opencode/skills/`） |
| `path.mount_allowlist` | 挂载白名单（`~/.config/aeroloongclaw/mount-allowlist.json`） |
| `path.sender_allowlist` | 发送者白名单（`data/sender-allowlist.json`） |

路径缺失时状态为 `warn`（而非 `error`），因为首次安装时部分目录可能尚未创建。但如果父目录不可写，则为 `error`。

::: tip 路径权限问题
如果容器内进程（uid 1000）在 host 创建的目录中遇到 `EACCES`，需要手动 chown：

```bash
sudo chown -R 1000:1000 /path/to/dir
```

详见 [部署经验：Host 创建的目录在容器中无权限](./lessons#host创建的目录在容器中无权限)。
:::

#### model_credentials — 模型凭据

根据 `OPENCODE_MODEL` 或 `MODEL` 环境变量确定当前模型提供商，检查对应 API key 是否已配置。

| 提供商 | 检查的凭据 |
|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` 或 `CLAUDE_CODE_OAUTH_TOKEN` |
| `openai` | `OPENAI_API_KEY` |
| `google` / `gemini` | `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` |
| `minimax` | `MINIMAX_API_KEY` |

**常见故障与修复：**

| 症状 | 修复方法 |
|---|---|
| `缺少 minimax 模型凭据` | 在 `.env` 中添加 `MINIMAX_API_KEY=sk-...` |
| `缺少 anthropic 模型凭据` | 在 `.env` 中添加 `ANTHROPIC_API_KEY=sk-ant-...` |

#### channel.* — 渠道就绪状态

检查已启用的消息渠道及其凭据配置。`channel.none` 状态为 `warn`，表示没有启用任何内置 channel。

| 渠道 | 启用条件 |
|---|---|
| `wecom` | `WECOM_ENABLED=true` 且 Bot ID/Secret 已配置 |
| `web` | `WEB_UI_ENABLED=true`（默认为 true） |

#### database — SQLite 数据库

检查 `store/messages.db` 是否可读，并返回数据库摘要：

- `registeredGroups`: 已注册的群组数量
- `activeTasks`: 状态为 active 的定时任务数量
- `lastMessageTime`: 最近一条消息的时间戳
- `lastTaskRunAt`: 最近一次任务执行时间

```bash
# 直接查看数据库状态
sqlite3 store/messages.db "SELECT COUNT(*) FROM registered_groups;"
```

#### runtime.snapshot — 运行时快照

读取 `data/runtime-status.json`（15s 心跳写入），检查快照是否存在、是否过期、是否有性能瓶颈。

| 状态 | 含义 |
|---|---|
| `ok` | 快照正常，存在活跃 runs 和群组信息 |
| `warn` | 快照已过期（updatedAt 过旧）或检测到性能瓶颈 |
| `unknown` | 服务未运行，尚无快照 |

#### runtime.recent — 最近运行指标

从 SQLite `runtime_run_metrics` 表汇总最近 24 小时的运行指标：

| 指标 | 含义 |
|---|---|
| `totalRuns` | 统计周期内的总运行次数 |
| `avgQueueWaitMs` | 平均队列等待时间（毫秒） |
| `avgTimeToFirstProgressMs` | 平均首次进度时间（毫秒） |
| `avgTimeToFinalOutputMs` | 平均最终输出时间（毫秒） |

无运行记录时状态为 `unknown`。

#### metrics.registry — Prometheus Metrics

检查 Prometheus metrics 注册表中是否有自定义指标。状态为 `warn` 表示注册表已加载但自定义指标缺失（可能影响 `npm run status` 的部分输出）。

#### mcp.* — 插件 MCP 配置

检查 `.opencode/skills/` 下各技能的 `.mcp.json` 文件有效性，以及连接器凭据是否完整配置。

| 状态 | 含义 |
|---|---|
| `ok` | MCP server URL 已配置，凭据完整 |
| `warn` | 部分凭据缺失（`missing xxx`）或无 endpoint URL |
| `error` | `.mcp.json` 格式错误或解析失败 |

::: tip 无 MCP 技能时
如果未安装任何插件技能，这些检查会被跳过（无 mcp.* 项）。这属于正常状态。
:::

#### wecom.summary — WeCom 诊断摘要

当 `WECOM_ENABLED=true` 时，`doctor` 会内联调用 `wecom:doctor` 的结果。详细检查项见下文 [npm run wecom:doctor](#npm-run-wecom-doctor--企业微信诊断)。

---

## npm run wecom:doctor — 企业微信诊断

`npm run wecom:doctor` 是专门针对企业微信通道的深度诊断工具，独立运行，不需要 Docker 或 TTY。

```bash
npm run wecom:doctor    # 输出格式：✓/⚠/✗ + 检查名 + 消息 + 修复建议
```

> 注意：如果 `WECOM_ENABLED` 不为 `true`，所有检查结果为 `warn`，表示 WeCom 诊断已跳过。

### 检查项详解

#### 凭据配置

**检查项 ID：** `凭据配置`

验证 `WECOM_BOT_ID` 和 `WECOM_BOT_SECRET` 是否已配置，并检测是否存在旧版回调配置残留。

| 状态 | 含义 |
|---|---|
| `ok` | Bot ID / Bot Secret 已配置，无旧版残留 |
| `error` | 缺少必需凭据，或检测到已废弃的 URL 回调配置（如 `WECOM_CORP_ID`、`WECOM_AGENT_ID`、`WECOM_SECRET`） |

**修复：** 重新运行 WeCom 向导，或在 `.env` 中补齐 Bot ID / Secret，并移除旧版变量（`WECOM_CORP_ID`、`WECOM_AGENT_ID`、`WECOM_SECRET`、`WECOM_URL`、`WECOM_CALLBACK_URL`）。

#### 长连接状态

**检查项 ID：** `长连接状态`

读取 `data/wecom-health.json` 中的连接状态，判断 WebSocket 长连接是否正常。

| 状态 | 含义 |
|---|---|
| `ok` | 当前已连接，最近一次认证成功 |
| `warn` | 处于重连阶段 / 存在历史错误 / 认证成功但当前未标记已连接 / 尚无连接记录 |

**常见故障与修复：**

| 症状 | 修复方法 |
|---|---|
| `当前处于重连阶段` | 检查网络是否可访问 `openws.work.weixin.qq.com`；确认 Bot ID / Secret 仍有效 |
| `最近一次连接错误` | 检查 Bot ID / Secret、网络连通性及长连接地址配置 |
| `尚无认证或连接记录` | 启动主服务或重新运行 WeCom 向导，生成第一条长连接健康记录 |

#### 入站消息

**检查项 ID：** `入站消息`

检查是否正常收到来自企业微信的消息。

| 状态 | 含义 |
|---|---|
| `ok` | 最近一次收到消息（标注消息类型和时间） |
| `warn` | 最近只有事件回调而无真实消息 / 入站处理曾失败 / 尚无记录 |

**常见故障与修复：**

| 症状 | 修复方法 |
|---|---|
| `最近只收到事件回调，尚无真实消息` | 从企业微信给机器人发送一条真实消息，验证消息收取链路 |
| `最近一次入站处理失败` | 检查消息体兼容性、媒体下载与群聊配置 |
| `尚无入站消息记录` | 在企业微信里私聊或群聊触发一次真实消息 |

#### 消息发送

**检查项 ID：** `消息发送`

检查机器人是否曾成功向企业微信发送消息。

| 状态 | 含义 |
|---|---|
| `ok` | 最近一次发送成功 |
| `warn` | 发送曾失败 / 尚无发送记录 |

**修复：** 通过 WeCom 向导发送一条测试消息，或让定时任务主动推送一次，确认 founder/test 用户可见机器人。

#### Founder Bootstrap

**检查项 ID：** `Founder Bootstrap`

检查 `WECOM_FOUNDER_USER_ID` 是否已配置（首个授权用户的 UserID）。

| 状态 | 含义 |
|---|---|
| `ok` | 首个授权用户已配置 |
| `warn` | 尚未配置 `WECOM_FOUNDER_USER_ID` |

**修复：** 重新运行 WeCom 向导，或在 `.env` 中补充 `WECOM_FOUNDER_USER_ID`。

#### 准入策略

**检查项 ID：** `准入策略`

检查 `data/sender-allowlist.json` 中 WeCom sender policy 是否安全。

| 状态 | 含义 |
|---|---|
| `ok` | `channelDefaults.wecom` 为 `fail-closed`（`allow: []`, `mode: "drop"`） |
| `error` | Sender policy 不安全 |

**修复：** 编辑 `~/.config/aeroloongclaw/sender-allowlist.json`，将 `channelDefaults.wecom.mode` 设为 `"drop"` 并清空 `allow` 数组。

---

## npm run smoke:setup — 安装/卸载冒烟测试

`npm run smoke:setup` 是一组隔离环境下的安装/卸载流程测试，不依赖 Docker、服务或 TTY，所有提示均通过 mock 注入。

```bash
npm run smoke:setup              # 运行全部 9 个测试用例
npm run smoke:setup -- <filter>   # 按 ID 过滤（如 env-configure）
```

测试报告输出至 `deliverables/setup-smoke-last-report.json`。

### 测试用例说明

| 用例 ID | 标题 | 验证内容 |
|---|---|---|
| `env-configure` | stepConfigureEnv writes .env correctly | `.env` 写入 `MINIMAX_API_KEY`、`OPENCODE_MODEL`、`ASSISTANT_NAME` 三个键值正确 |
| `env-reconfigure` | Reconfigure preserves existing keys | 重新配置时保留已有的 `OPENAI_API_KEY` 和 `ASSISTANT_NAME` |
| `env-assistant-name-no-quotes` | ASSISTANT_NAME has no extra quotes | `ASSISTANT_NAME` 值无多余引号包裹（历史回归测试） |
| `register-group` | Group registration creates DB record and directory | 群组注册同时创建 SQLite `registered_groups` 记录和 `groups/<name>/` 目录（含 4 个指令文件） |
| `prompt-secret-visible` | promptSecret question text is visible | `promptSecret` 将问题文本正确传递给 `askSecret`（历史回归测试） |
| `upsert-env-atomic` | upsertEnv preserves existing keys when adding new ones | `upsertEnv` 在添加新 key 时保留已有 key |
| `upsert-env-delete-empty` | upsertEnv removes key when value is empty | `upsertEnv` 在值为空时删除 key（而非写入空字符串） |
| `service-stop` | stopService returns correct shape without errors | `stopService()` 返回正确的结构，无异常 |
| `full-install-uninstall` | Full install → verify → uninstall flow | 完整流程：`.env` 配置 → SQLite 注册 → 群组目录创建 → `uninstallService` 清理 |

### 输出示例

```
Setup Smoke Tests (9 cases)

  ✓ stepConfigureEnv writes .env correctly  12ms
  ✓ Reconfigure preserves existing keys  8ms
  ✓ ASSISTANT_NAME has no extra quotes  5ms
  ✓ Group registration creates DB record and directory  23ms
  ✓ promptSecret question text is visible  3ms
  ✓ upsertEnv preserves existing keys when adding new ones  7ms
  ✓ upsertEnv removes key when value is empty  6ms
  ✓ stopService returns correct shape without errors  412ms
  ✓ Full install → verify → uninstall flow  531ms

Results: 9 passed
Report: deliverables/setup-smoke-last-report.json
```

### 使用场景

- **CI/CD 验证**：每次构建后运行，确保安装/卸载逻辑未被破坏
- **回归检测**：修复 `.env` 相关 bug 后快速验证
- **环境诊断**：某次 `wizard` 中断后，用此测试验证环境写入逻辑是否仍正常

---

## npm run status — 运行时状态快照

`npm run status` 读取 `data/runtime-status.json` 快照和 SQLite `runtime_run_metrics` 表，输出当前活跃运行、队列状态和性能指标。

```bash
npm run status                  # 人类可读输出
npm run status -- --json        # JSON 格式输出
npm run status -- --group <name>  # 仅显示指定群组
npm run status -- --window-hours 48  # 统计窗口（默认 24h）
```

### 输出字段说明

```
Live Runtime Snapshot
Updated: 2026-03-26T10:30:00.000Z          # 快照更新时间
Queue: active=2/5                           # 当前活跃容器数 / 最大并发数

Groups
- main: active=1, pendingChat=0, buffered=3, pendingTasks=2, ipcBacklog=0
- project-a: active=0, pendingChat=2, buffered=5, pendingTasks=0, ipcBacklog=1

Active Runs
- run_abc123 [chat] group=main stage=n/a role=n/a idle=false ipcBacklog=0
    tools: 12 calls (4.2s) | permissions: 3 (0.8s) latest=mcp__browser__navigate
- run_def456 [complex] group=project-a stage=executor role=researcher idle=true ipcBacklog=0

Recent Summary (24h)
- totalRuns=47
- avgQueueWaitMs=320
- avgTimeToFirstProgressMs=1850
- avgTimeToFinalOutputMs=28400
- restart=1, summarize=2, abort=0

Performance (24h)
- avgToolCalls=8.3  avgToolCallMs=342  avgPermissionMs=210

Diagnoses
- snapshot_stale: runtime 快照超过 15s 未更新
- queue_backlog: project-a 群组待处理消息积压超过 10 条
```

### 字段详解

#### Groups（群组状态）

| 字段 | 含义 |
|---|---|
| `active` | 当前活跃的 chat runs 数量 |
| `pendingChat` | 等待执行的聊天消息数量 |
| `buffered` | 已缓冲但尚未进入队列的消息数量 |
| `pendingTasks` | 等待执行的定时任务数量 |
| `ipcBacklog` | IPC 文件积压深度（尚未被 host 读取的 IPC 消息数） |

#### Active Runs（活跃运行）

| 字段 | 含义 |
|---|---|
| `runId` | 运行的唯一标识符 |
| `runKind` | 运行类型：`chat` 或 `complex`（多步骤任务） |
| `stage` | 复杂任务的当前阶段：`build` / `planner` / `researcher` / `executor` / `reviewer` |
| `role` | 当前 agent 角色（如 `researcher`、`executor`） |
| `idle` | 是否处于空闲等待状态 |
| `ipcBacklog` | 该运行的 IPC 积压深度 |
| `toolCallCount` | 工具调用总次数 |
| `totalToolCallMs` | 工具调用总耗时（毫秒） |
| `permissionCount` | 权限申请次数 |
| `totalPermissionWaitMs` | 权限等待总耗时（毫秒） |
| `latestToolName` | 最近一次工具调用名称 |

#### Recent Summary（近期运行摘要）

| 字段 | 含义 |
|---|---|
| `totalRuns` | 统计窗口内总运行次数 |
| `avgQueueWaitMs` | 从消息入队到容器启动的平均等待时间（毫秒） |
| `avgTimeToFirstProgressMs` | 从容器启动到首次 agent 产出的平均时间（毫秒） |
| `avgTimeToFinalOutputMs` | 从容器启动到最终输出的平均总时间（毫秒） |
| `restart / summarize / abort` | 重启 / 总结 / 中止次数 |

#### Diagnoses（瓶颈诊断）

| 类型 | 含义 |
|---|---|
| `snapshot_stale` | 快照超过 15s 未更新，可能服务卡住或心跳写入失败 |
| `queue_backlog` | 某群组待处理消息积压过多 |
| `container_leak` | 检测到未正常清理的容器 |
| `runtime_hotspot` | 某群组的 avgTimeToFirstProgressMs 异常高 |

---

## npm run backup:state — 状态备份

`npm run backup:state` 将 AeroLoongClaw 的运行时状态完整备份到 `data/backups/<timestamp>/` 目录。

```bash
npm run backup:state                           # 执行备份
npm run backup:state -- --dry-run              # 预览（不写入文件）
npm run backup:state -- --output /path/to/dir  # 指定输出目录
```

### 备份内容

| 项 ID | 类型 | 说明 |
|---|---|---|
| `env_file` | 文件 | `.env` 配置文件（包含所有 API key 和配置变量） |
| `mount_allowlist` | 文件 | 挂载白名单 |
| `sender_allowlist` | 文件 | 发送者白名单 |
| `store_dir` | 目录 | `store/` 下除 `messages.db` 及其 sidecar 外的所有内容 |
| `sqlite_messages_db` | SQLite | `messages.db` 通过 `better-sqlite3 backup API` 生成一致性快照 |
| `data_dir` | 目录 | `data/`（排除 `backups/` 子目录，避免递归） |
| `groups_dir` | 目录 | 所有群组的工作区目录（含 `SOUL.md`、`USER.md`、`AGENTS.md`、`MEMORY.md`） |
| `custom_skills_dir` | 目录 | 自定义技能目录（`.opencode/skills/`） |

备份完成后会在输出目录生成 `manifest.json`，记录所有项的来源路径、快照路径、是否包含等信息。

### 使用建议

::: tip 备份时机
- 在 `npm run wizard` 完成后备份（记录初始配置）
- 在升级 AeroLoongClaw 之前备份（确保可回滚）
- 定期备份（建议纳入 cronjob）
:::

```bash
# 示例：升级前备份
npm run backup:state -- --output /opt/aeroloongclaw-backup-before-upgrade
```

---

## npm run restore:state — 状态恢复

`npm run restore:state` 从备份快照恢复 AeroLoongClaw 状态。

```bash
npm run restore:state -- /path/to/backup/dir   # 执行恢复
npm run restore:state -- --dry-run /path/to/backup/dir  # 预览
```

### 恢复流程

1. **服务停止检查**：如果检测到 AeroLoongClaw 服务仍在运行，restore 会拒绝执行（防止数据覆盖冲突）。需先 `npm run service:stop`（或 `launchctl bootout` / `systemctl --user stop`）。

2. **恢复前自动备份**：执行恢复前会自动在 `data/backups/pre-restore-<timestamp>/` 创建一份当前状态的备份，防止恢复失败导致数据丢失。

3. **选择性覆盖**：仅恢复快照中存在的项。`data/backups/` 目录在恢复时被保留，不被覆盖。

4. **服务不自启**：恢复完成后服务不会自动重启，需人工验证后再启动。

### 常见故障与修复

| 症状 | 修复方法 |
|---|---|
| `检测到服务仍在运行，拒绝执行 restore` | 先停止服务：`npm run service:stop`（macOS/Linux）或 `launchctl bootout`（macOS） |
| `备份快照目录不存在` | 确认路径正确；快照目录格式为 `data/backups/<timestamp>/` |
| `manifest.json 无效` | 该快照可能已损坏；尝试使用其他快照或重新备份 |

::: warning 恢复操作会覆盖当前状态
恢复操作会直接覆盖当前文件系统中的 `.env`、各数据目录和群组目录。如果不确定，请先执行 `--dry-run` 预览影响范围。
:::

---

## 快速诊断流程

遇到问题时，建议按以下顺序检查：

```bash
# 1. 快速系统健康检查
npm run doctor

# 2. 如果启用了企业微信，深度检查 WeCom
npm run wecom:doctor

# 3. 查看当前运行时状态
npm run status

# 4. 如果最近有异常，重启服务
npm run service:stop
# 等待 5 秒
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aeroloongclaw.plist   # macOS
# systemctl --user start aeroloongclaw   # Linux

# 5. 如果服务无法启动，查看日志
tail -n 100 logs/aeroloongclaw.log
```
