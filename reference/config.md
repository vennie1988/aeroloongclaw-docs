# 配置参考

本文档列出 AeroLoongClaw 所有环境变量及其默认值。完整列表来源：`src/config.ts`。

## 环境变量读取优先级

```
`.env` 文件 < process.env < 默认值
```

:::note
`.env` 文件中的值会覆盖代码中的默认值，但 `process.env` 中的值优先级最高。
:::

## AI 模型配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENCODE_MODEL` | `minimax/MiniMax-M2.7` | 用于 OpenCode 任务的语言模型，格式为 `provider/model` |
| `MODEL` | — | `OPENCODE_MODEL` 的别名，兼容旧版本 |
| `ASSISTANT_NAME` | `Andy` | 助手名字，用户在聊天中用来 @ 助手的名字 |
| `ASSISTANT_HAS_OWN_NUMBER` | `false` | 助手是否拥有专用电话号码。`true` 时私聊不需要 @ 触发 |

## Provider API Keys

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 |
| `ANTHROPIC_BASE_URL` | 自定义 Anthropic API 端点（用于代理） |
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Google API 密钥 |
| `MINIMAX_API_KEY` | MiniMax API 密钥（Anthropic 兼容端点） |

## 企业微信配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WECOM_ENABLED` | `false` | 是否启用企业微信渠道 |
| `WECOM_BOT_ID` | — | 企业微信智能机器人 Bot ID |
| `WECOM_BOT_SECRET` | — | 企业微信智能机器人 Bot Secret |
| `WECOM_WEBSOCKET_URL` | `wss://openws.work.weixin.qq.com` | 企业微信长连接地址 |
| `WECOM_FOUNDER_USER_ID` | — | 企业微信创始人用户 ID，用于首次部署引导 |

## Web UI 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WEB_UI_ENABLED` | `true` | 是否启用本地 Web 测试聊天界面 |
| `WEB_UI_HOST` | `127.0.0.1` | Web UI 绑定主机地址 |
| `WEB_UI_PORT` | `3100` | Web UI 监听端口 |
| `WEB_UI_TOKEN` | — | Web UI 访问令牌，留空则自动生成 |

## HTTP API 网关配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_HOST` | `127.0.0.1` | HTTP API 网关绑定地址 |
| `API_PORT` | `3200` | HTTP API 网关监听端口 |
| `API_TOKEN` | — | HTTP API Bearer token，留空则不启动 API 服务器 |
| `METRICS_TOKEN` | — | `/metrics` 端点的独立 Bearer token |

## 容器配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CONTAINER_IMAGE` | `aeroloongclaw-agent:latest` | Docker 镜像名称和标签 |
| `CONTAINER_TIMEOUT` | `1800000` | 容器执行任务超时时间（毫秒，30 分钟） |
| `CONTAINER_MAX_OUTPUT_SIZE` | `10485760` | 容器输出最大大小（字节，10MB） |
| `IDLE_TIMEOUT` | `1800000` | 容器空闲超时时间（毫秒，30 分钟） |
| `MAX_CONCURRENT_CONTAINERS` | `5` | 同时运行的最大容器数量 |
| `PER_GROUP_MAX_PARALLEL_TASKS` | `3` | 单个群组允许并行执行的 isolated 计划任务数量上限 |
| `PER_GROUP_MAX_PARALLEL_CHAT_RUNS` | `1` | 单个群组允许并行执行的聊天任务数量上限 |

## 媒体存储配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MEDIA_MAX_FILE_SIZE` | `52428800` | 单个媒体文件最大大小（字节，50MB） |
| `MEDIA_MAX_GROUP_STORAGE` | `524288000` | 单个群组媒体目录最大总容量（字节，500MB） |
| `MEDIA_CLEANUP_MAX_AGE_DAYS` | `7` | 媒体文件保留天数 |
| `MEDIA_CLEANUP_INTERVAL` | `21600000` | 媒体清理任务轮询间隔（毫秒，6 小时） |

## OpenCode 功能开关

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENCODE_EVENT_BRIDGE_ENABLED` | `true` | 启用事件桥接 |
| `OPENCODE_PERMISSION_BRIDGE_ENABLED` | `true` | 启用权限桥接 |
| `OPENCODE_NATIVE_ASSETS_ENABLED` | `true` | 启用原生资产 |
| `OPENCODE_NATIVE_AGENTS_ENABLED` | `true` | 启用原生 agent 流水线 |

## 其他配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TZ` | 系统时区 | 用于计划任务的时区 |
| `CHAT_QUEUE_ACK_ENABLED` | `false` | 是否启用聊天队列确认机制 |

## 路径配置（可通过环境变量覆盖）

| 变量 | 说明 |
|------|------|
| `AEROLOONGCLAW_ENV_FILE` | `.env` 文件路径 |
| `AEROLOONGCLAW_STORE_DIR` | 持久化数据存储目录 |
| `AEROLOONGCLAW_DATA_DIR` | 通用数据目录 |
| `AEROLOONGCLAW_GROUPS_DIR` | 群组工作区目录 |
| `AEROLOONGCLAW_CUSTOM_SKILLS_DIR` | 自定义 skills 目录 |
| `AEROLOONGCLAW_LOGS_DIR` | 日志目录 |
| `AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH` | 挂载白名单 JSON 文件路径 |
| `AEROLOONGCLAW_SENDER_ALLOWLIST_PATH` | 发送者白名单 JSON 文件路径 |

:::tip
Release 安装模式下，这些路径默认位于 `/etc/aeroloongclaw/` 和 `/var/lib/aeroloongclaw/`。
:::

## 内部常量（不可配置）

| 常量 | 值 | 说明 |
|------|-----|------|
| `POLL_INTERVAL` | `2000` | 主事件循环轮询间隔（毫秒） |
| `SCHEDULER_POLL_INTERVAL` | `60000` | 任务调度器轮询间隔（毫秒） |
| `IPC_POLL_INTERVAL` | `1000` | IPC 轮询间隔（毫秒） |
| `CONTAINER_MEDIA_PREFIX` | `/workspace/group/media` | 容器内媒体目录路径 |
