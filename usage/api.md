---
title: API 参考
description: AeroLoongClaw Core TypeScript SDK 参考手册
---

# API 参考

> 版本对应：AeroLoongClaw v1.2.6 · 默认模型 MiniMax-M2.7 · Node.js 22+

AeroLoongClaw Core 是一个**容器化 Agent 执行引擎**。它将 LLM Agent（含工具调用、多轮推理、文件生成）封装在 Docker 容器中隔离执行，通过一个简洁的 TypeScript API 暴露给上层应用。

```
你的应用  ──→  kernel.run(group, prompt, options)  ──→  AgentResult { text, files }
```

核心特性：

- **一个函数调用**：`kernel.run()` 是唯一入口，输入 prompt + 文件，输出文本 + 文件
- **容器隔离**：每次执行在独立 Docker 容器中运行，文件系统、网络、进程完全隔离
- **会话持久化**：同一 group 的多次 `run()` 自动保持对话上下文
- **多模态**：输入支持图片/文档/音频/视频；输出支持 PPTX/DOCX/XLSX/PDF/图片/音频/视频
- **77+ Skills**：从深度研究、数据分析到文档生成、多媒体创作

```
npm 包名:  aeroloongclaw
导入路径:  aeroloongclaw/core
```

---

## 安装与前置条件

### 前置条件

| 依赖 | 要求 |
|------|------|
| Node.js | 22+ |
| Docker | 运行中（或 Apple Container on macOS） |
| 容器镜像 | `aeroloongclaw-agent:latest`（需提前构建） |
| API Key | 至少一个 LLM provider key（推荐 `MINIMAX_API_KEY`） |

### 安装

```bash
# 方式 1：npm 包（如果已发布到 registry）
npm install aeroloongclaw

# 方式 2：本地路径（开发阶段）
npm install /path/to/aeroloongclaw

# 方式 3：Git 依赖
npm install git+ssh://git@github.com:AeroLoongAI/aeroloongclaw.git
```

### 构建容器镜像

```bash
cd /path/to/aeroloongclaw
./container/build.sh
# 产出: aeroloongclaw-agent:latest
```

---

## 快速开始

```typescript
import { AgentKernel } from 'aeroloongclaw/core';

// 1. 创建 kernel
const kernel = new AgentKernel({
  dataDir: './data',
  groupsDir: './groups',
  assistantName: 'Aria',
  model: 'minimax/MiniMax-M2.7',
  containerImage: 'aeroloongclaw-agent:latest',
  secrets: {
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY!,
  },
});

// 2. 初始化（加载 DB、恢复状态）
await kernel.init();

// 3. 执行
const result = await kernel.run('my-project', '用 3 个要点总结量子计算的现状');

console.log(result.text);       // Agent 的文本回复
console.log(result.status);     // 'success'
console.log(result.durationMs); // 执行耗时 (ms)

// 4. 关闭（持久化状态）
await kernel.shutdown();
```

:::tip
**group 的概念**：第一个参数 `'my-project'` 是 group 名称。同名 group 的多次调用共享会话上下文和文件空间。命名规则：`^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`。
:::

---

## 核心 API

### AgentKernel

执行引擎的核心类。整个应用生命周期通常只需要一个实例。

```typescript
import { AgentKernel } from 'aeroloongclaw/core';

const kernel = new AgentKernel(options: AgentKernelOptions);
```

| 方法 | 签名 | 说明 |
|------|------|------|
| `init()` | `() → Promise<void>` | 初始化 DB 和状态，**必须在 `run()` 之前调用** |
| `run()` | `(group, prompt, options?) → Promise<AgentResult>` | 执行 Agent 任务 |
| `shutdown()` | `() → Promise<void>` | 持久化状态，优雅关闭 |
| `registerGroup()` | `(jid, group) → void` | 手动注册群组（通常不需要，`run()` 会自动注册） |
| `getRegisteredGroups()` | `() → Record<string, RegisteredGroup>` | 获取所有已注册群组 |
| `getSessions()` | `() → Record<string, string>` | 获取所有群组的 sessionId 映射 |

### kernel.run()

```typescript
async run(
  groupFolder: string,
  prompt: string,
  options?: RunOptions
): Promise<AgentResult>
```

**参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `groupFolder` | `string` | ✅ | 群组名称，决定隔离的文件空间和会话上下文 |
| `prompt` | `string` | ✅ | 发送给 Agent 的指令 |
| `options` | `RunOptions` | ❌ | 可选配置（文件、skills、模型等） |

**返回值：** `Promise<AgentResult>`

### AgentResult

```typescript
interface AgentResult {
  /** 最终文本输出（Agent 的回复） */
  text: string | null;

  /** 产出的文件列表（PPTX、图片、音频等） */
  files: OutputFile[];

  /** 会话 ID（可用于后续调用恢复会话） */
  sessionId: string;

  /** 执行耗时 (ms) */
  durationMs: number;

  /** 执行状态 */
  status: 'success' | 'error';

  /** 错误信息（仅 status === 'error' 时存在） */
  error?: string;
}
```

### RunOptions

```typescript
interface RunOptions {
  /** 指定使用的 skills（覆盖默认全量加载） */
  skills?: string[];

  /** 输入文件列表（图片、文档等） */
  files?: InputFile[];

  /** 覆盖默认模型（provider/model 格式） */
  model?: string;

  /** 指定 sessionId（恢复特定历史会话） */
  sessionId?: string;

  /** 容器超时 (ms)，覆盖默认值（默认 1800000 = 30min） */
  timeout?: number;

  /** 隔离任务（不继承群组会话上下文） */
  isolated?: boolean;

  /** 流式进度回调 */
  onProgress?: (event: ProgressEvent) => void;
}
```

### InputFile / OutputFile

```typescript
/** 输入文件 */
interface InputFile {
  /** 宿主机上的绝对路径 */
  path: string;
  /** 文件类型（可选，自动推断） */
  type?: 'document' | 'image' | 'audio' | 'video';
  /** MIME 类型（可选，自动推断） */
  mimeType?: string;
}

/** 输出文件 */
interface OutputFile {
  type: 'document' | 'image' | 'audio' | 'video';
  mimeType: string;       // e.g. 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  filename: string;       // e.g. 'report.pptx'
  localPath: string;      // 宿主机绝对路径，可直接读取
  size: number;           // 字节
}
```

### ProgressEvent（流式进度）

```typescript
interface ProgressEvent {
  type: 'text' | 'file' | 'status';
  /** 中间文本输出 */
  text?: string;
  /** 中间文件产出 */
  file?: OutputFile;
  /** 状态描述（如 "正在搜索..."） */
  status?: string;
}
```

### AgentKernelOptions

```typescript
interface AgentKernelOptions {
  /** 数据目录（SQLite、IPC、状态文件） */
  dataDir: string;

  /** 群组根目录（每个 group 在此下有独立子目录） */
  groupsDir: string;

  /** 助手名称（出现在 Agent 的身份设定中） */
  assistantName: string;

  /** 默认模型（provider/model 格式） */
  model: string;

  /** Docker 容器镜像名称 */
  containerImage: string;

  /** Secrets / API Keys（通过 stdin 传给容器，不进环境变量） */
  secrets: Record<string, string>;

  /** 最大并发容器数（默认 5） */
  maxConcurrentContainers?: number;

  /** 容器超时 ms（默认 1800000 = 30min） */
  containerTimeout?: number;

  /** 空闲超时 ms（默认 1800000 = 30min） */
  idleTimeout?: number;

  /** 运行时特性标志 */
  runtimeFlags?: Partial<RuntimeFeatureFlags>;

  /** 自定义 skills 目录 */
  skillsDirs?: string[];

  /** 应用根目录（解析 agent-runner 源码路径） */
  appRoot?: string;
}
```

**RuntimeFeatureFlags：**

```typescript
interface RuntimeFeatureFlags {
  eventBridgeEnabled: boolean;       // 运行时事件桥接（默认 true）
  permissionBridgeEnabled: boolean;  // 权限桥接（默认 true）
  nativeAssetsEnabled: boolean;      // 原生 Agent 模板（默认 true）
  nativeAgentsEnabled: boolean;      // 原生 Agent 流水线（默认 true）
}
```

---

## 使用模式

### 单次调用

最简单的用法——发一条指令，拿到结果：

```typescript
const result = await kernel.run('workspace', '解释 Transformer 架构的核心原理');
console.log(result.text);
```

### 多轮对话（会话保持）

同一个 group 的连续 `run()` 调用自动共享会话上下文，Agent 记得之前的对话：

```typescript
// 第一轮
await kernel.run('chat', '我在做一个 Rust 项目，需要处理并发');
// 第二轮——Agent 知道你在讨论 Rust 并发
await kernel.run('chat', '有哪些常见的坑？');
// 第三轮——继续在同一上下文中
await kernel.run('chat', '给我一个 tokio 的实际例子');
```

如果要手动恢复特定会话：

```typescript
const result = await kernel.run('chat', '继续上次的讨论', {
  sessionId: 'previously-saved-session-id',
});
```

### 多步流水线

利用会话保持实现复杂的多步工作流：

```typescript
// Step 1: 深度调研
const research = await kernel.run('quarterly-report',
  '深度调研 2024 Q4 新能源汽车市场',
  { skills: ['deep-research', 'web-search'] }
);

// Step 2: 数据分析（带文件输入）
const analysis = await kernel.run('quarterly-report',
  '分析这份销售数据，结合上面的调研结果',
  { files: [{ path: '/data/sales-q4.csv' }], skills: ['data-analysis'] }
);

// Step 3: 生成交付物
const deliverable = await kernel.run('quarterly-report',
  '将分析结论整理为客户汇报 PPT 和详细报告 Word 文档',
  { skills: ['pptx', 'docx'] }
);

// 拿到产出的文件
for (const file of deliverable.files) {
  console.log(`${file.filename} (${file.size} bytes)`);
  // → "Q4市场分析.pptx (524288 bytes)"
  // → "详细报告.docx (131072 bytes)"
  fs.copyFileSync(file.localPath, `/output/${file.filename}`);
}
```

### 文件输入（多模态）

传入的文件自动复制到 group 的 media 目录，容器内通过 `/workspace/group/media/` 访问：

```typescript
const result = await kernel.run('analysis', '对比分析这两份报告', {
  files: [
    { path: '/data/report-2023.pdf', type: 'document' },
    { path: '/data/report-2024.pdf', type: 'document' },
    { path: '/data/trend-chart.png', type: 'image' },  // 图片 → LLM 视觉理解
  ],
});
```

**文件类型处理：**

| 类型 | 扩展名 | LLM 处理方式 |
|------|--------|-------------|
| `image` | jpg, png, gif, webp | **视觉理解**（作为多模态 file part 传入 LLM） |
| `document` | pdf, docx, xlsx, pptx, txt, csv | 文本引用 |
| `audio` | mp3, m4a, wav, ogg | 文本引用 |
| `video` | mp4, mov, mkv | 文本引用 |

**配额限制：**
- 单文件最大：50 MB
- 每个 group 总量上限：500 MB
- 自动 SHA-256 去重（同内容文件不会重复存储）

### 文件输出（文档生成）

Agent 通过 IPC MCP 工具生成的文件会自动收集到 `AgentResult.files`：

```typescript
const result = await kernel.run('reports', '生成本月销售报告 Excel', {
  skills: ['xlsx'],
});

for (const file of result.files) {
  console.log(file.filename);    // "sales-report.xlsx"
  console.log(file.mimeType);    // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  console.log(file.localPath);   // "/abs/path/to/groups/reports/media/abc123.xlsx"
  console.log(file.size);        // 45056
}
```

### 隔离任务

每次从零开始，不继承 group 的历史会话上下文：

```typescript
const result = await kernel.run('daily', '生成今日报告', {
  isolated: true,  // 全新会话，不读取历史
});
```

### 模型切换

按需为特定任务使用不同模型：

```typescript
// 默认模型（初始化时设置的 minimax/MiniMax-M2.7）
await kernel.run('general', '日常任务');

// 复杂推理用 Claude
await kernel.run('complex', '多步推理任务', {
  model: 'anthropic/claude-sonnet-4-6',
});

// 快速任务用 GPT
await kernel.run('quick', '简单翻译', {
  model: 'openai/gpt-4o-mini',
});
```

:::warning
使用其他 provider 的模型需要在 `secrets` 中提供对应的 API Key。
:::

### 流式进度

通过 `onProgress` 回调实时获取执行进度：

```typescript
const result = await kernel.run('long-task', '深度分析市场趋势', {
  onProgress: (event) => {
    switch (event.type) {
      case 'status':
        console.log(`[进度] ${event.status}`);
        break;
      case 'text':
        process.stdout.write(event.text ?? '');
        break;
      case 'file':
        console.log(`[文件生成] ${event.file!.filename}`);
        break;
    }
  },
});
```

### Skills 选择

默认加载所有可用 skills。通过 `skills` 参数可精确控制：

```typescript
// 只加载特定 skills（减少 prompt 长度，提高专注度）
await kernel.run('finance', '分析财报', {
  skills: ['data-analysis', 'xlsx', 'finance--variance-analysis'],
});

// 空数组 = 不加载任何 skill
await kernel.run('bare', '纯文本对话', { skills: [] });
```

---

## HTTP API

除了 Node.js SDK，AeroLoongClaw 提供 HTTP API 网关，支持任何语言通过 REST/SSE 调用 Agent。

### 启动 API 服务器

```bash
# 方式 1：CLI
aeroloongclaw serve --token my-secret --port 3200

# 方式 2：Docker Compose
docker compose up -d

# 方式 3：代码中启动
import { AgentKernel } from 'aeroloongclaw/core';
import { createApiServer } from 'aeroloongclaw/dist/src/api/server.js';

const kernel = new AgentKernel(options);
await kernel.init();
const api = createApiServer({ kernel, token: 'my-secret', port: 3200 });
await api.start();
```

### 认证

所有请求需要 Bearer Token：

```
Authorization: Bearer <API_TOKEN>
```

`GET /metrics` 是例外：
- 默认不要求 `API_TOKEN`
- 如果配置了 `METRICS_TOKEN`，则改为要求 `Authorization: Bearer <METRICS_TOKEN>`
- 返回 Prometheus/OpenMetrics 文本，而不是 JSON

### 端点

#### POST /v1/run

执行 Agent 任务。

**请求体：**

```json
{
  "group": "my-project",
  "prompt": "分析这段代码的性能问题",
  "model": "minimax/MiniMax-M2.7",
  "skills": ["data-analysis"],
  "timeout": 300000,
  "isolated": false,
  "sessionId": "session-001",
  "stream": false
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group | string | 是 | 群组文件夹名 |
| prompt | string | 是 | 用户提示 |
| model | string | 否 | 模型标识（默认使用 OPENCODE_MODEL） |
| skills | string[] | 否 | 指定加载的 skills |
| timeout | number | 否 | 容器超时 (ms) |
| isolated | boolean | 否 | 隔离运行（不继承会话） |
| sessionId | string | 否 | 恢复指定会话 |
| stream | boolean | 否 | 启用 SSE 流式输出 |

**响应 (stream=false)：**

```json
{
  "id": "run_1711234567890_1",
  "status": "success",
  "text": "分析结果...",
  "files": [
    { "name": "report.md", "mimeType": "text/markdown", "size": 1234, "type": "document" }
  ],
  "sessionId": "session-001",
  "durationMs": 45000
}
```

**响应 (stream=true)：**

返回 SSE 事件流：

```
event: progress
data: {"type":"status","status":"正在分析..."}

event: progress
data: {"type":"text","text":"初步发现..."}

event: complete
data: {"id":"run_xxx","status":"success","text":"完整结果...","files":[],"sessionId":"session-001","durationMs":45000}
```

#### POST /v1/run/:id/stop

停止正在运行的任务。

```bash
curl -X POST http://localhost:3200/v1/run/run_xxx/stop \
  -H "Authorization: Bearer my-secret"
```

#### GET /v1/groups

列出所有已注册群组。

```json
{
  "groups": [
    { "jid": "kernel:my-project", "name": "my-project", "folder": "my-project", "addedAt": "2026-03-24T..." }
  ]
}
```

#### GET /v1/skills

列出所有可用 Skills。

```json
{
  "skills": [
    { "name": "data-analysis", "description": "使用 Python pandas 进行数据分析..." },
    { "name": "deep-research", "description": "深度研究与信息综合..." }
  ]
}
```

#### GET /v1/health

健康检查。

```json
{ "status": "ok", "timestamp": "2026-03-24T08:00:00.000Z", "activeRuns": 0 }
```

#### GET /metrics

暴露运行时 Prometheus/OpenMetrics 指标。

```bash
# 默认公开抓取
curl http://localhost:3200/metrics

# 配置了 METRICS_TOKEN 时
curl http://localhost:3200/metrics \
  -H "Authorization: Bearer <metrics-token>"
```

响应包含两类指标：
- AeroLoongClaw 自定义运行时指标
- `prom-client` 提供的 Node.js 进程默认指标

常用自定义指标：

| 指标名 | 类型 | 标签 | 说明 |
|------|------|------|------|
| `aeroloongclaw_active_runs` | Gauge | `group`, `run_kind` | 当前活跃运行数 |
| `aeroloongclaw_queue_depth` | Gauge | `group` | 队列等待深度 |
| `aeroloongclaw_buffered_messages` | Gauge | `group` | 缓冲消息数 |
| `aeroloongclaw_ipc_backlog_depth` | Gauge | `group` | IPC 积压深度 |
| `aeroloongclaw_runs_completed_total` | Counter | `group`, `run_kind`, `status` | 完成运行总数 |
| `aeroloongclaw_run_duration_seconds` | Histogram | `group`, `run_kind`, `status` | 运行耗时分布 |
| `aeroloongclaw_queue_wait_seconds` | Histogram | `group` | 队列等待耗时分布 |
| `aeroloongclaw_tool_call_duration_seconds` | Histogram | `tool_name` | 工具调用耗时分布 |
| `aeroloongclaw_permission_wait_seconds` | Histogram | `group` | 权限等待耗时分布 |
| `aeroloongclaw_ipc_latency_seconds` | Histogram | `group` | IPC 传递延迟分布 |
| `aeroloongclaw_tool_calls_per_run` | Histogram | `group`, `run_kind` | 每次运行工具调用次数 |

Prometheus 抓取示例：

```yaml
scrape_configs:
  - job_name: aeroloongclaw
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3200']
    # 若设置了 METRICS_TOKEN：
    # authorization:
    #   credentials: '<metrics-token>'
```

### 错误响应

```json
{ "error": "unauthorized" }          // 401 - Token 错误
{ "error": "missing_fields", "message": "group and prompt are required" }  // 400
{ "error": "not_found" }             // 404 - 路由不存在
{ "error": "run_not_found" }         // 404 - 运行 ID 不存在
{ "error": "internal_error" }        // 500 - 服务器错误
```

### Python/curl 示例

```python
import requests

API_URL = "http://localhost:3200"
TOKEN = "my-secret"

response = requests.post(
    f"{API_URL}/v1/run",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"group": "analysis", "prompt": "分析市场趋势"}
)
result = response.json()
print(result["text"])
```

---

## 错误处理

```typescript
const result = await kernel.run('task', '执行某个任务');

if (result.status === 'error') {
  console.error(`Agent 执行失败: ${result.error}`);
  // 常见错误：
  // - 容器超时
  // - Docker 不可用
  // - API Key 无效或余额不足
  // - 容器镜像不存在
}
```

**错误类型：**

| 场景 | status | error 示例 |
|------|--------|-----------|
| 正常完成 | `'success'` | `undefined` |
| 容器超时 | `'error'` | `'Container timed out after 1800000ms'` |
| Docker 不可用 | 抛异常 | `'spawn docker ENOENT'` |
| API 认证失败 | `'error'` | `'Authentication failed'` |
| 内容安全过滤 | `'error'` | `'Content contains sensitive material'` |

:::note
`kernel.run()` 内部的容器错误会被捕获并设置 `status: 'error'`。只有初始化阶段（如 Docker 不可用）会直接抛异常。
:::

---

## 并发与性能

### 并发限制

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `maxConcurrentContainers` | 5 | 全局并发容器上限 |
| `containerTimeout` | 1,800,000 ms (30min) | 单次执行硬超时 |
| `idleTimeout` | 1,800,000 ms (30min) | 容器空闲超时 |

### 并发安全

```typescript
// ✅ 安全：不同 group 可并发
await Promise.all([
  kernel.run('project-a', '任务 A'),
  kernel.run('project-b', '任务 B'),
  kernel.run('project-c', '任务 C'),
]);

// ⚠️ 同一 group 的并发调用会排队（串行执行）
// 这是为了保证会话上下文的一致性
```

### 性能预期

| 任务类型 | 典型耗时 |
|----------|---------|
| 简单问答 | 10-30s |
| 文档生成（PPTX/DOCX） | 30-90s |
| 深度调研 | 60-180s |
| TTS 语音合成 | 30-60s |
| 图片生成 | 5-15s |
| 视频生成 | 60-300s |
| 音乐生成 | 30-120s |

---

## 导出清单

`aeroloongclaw/core` 的完整导出：

```typescript
// 核心类
export { AgentKernel } from './agent-kernel';

// 核心类型
export type { AgentResult, RunOptions, OutputFile, InputFile, ProgressEvent } from './types';
export type { AgentKernelOptions } from './kernel-options';

// 工具函数
export { FileCollector, inferMediaType, inferMimeType } from './file-collector';
export type { IpcMediaInfo } from './file-collector';

// JID 工具（用于与消息驱动模式交互）
export { isWeComDmJid, isWeComGroupJid, isWebSessionJid, isKernelJid, jidNamespace } from './jid-utils';

// 基础类型（供高级集成使用）
export type { RegisteredGroup, NewMessage, ScheduledTask, MediaAttachment,
             OutboundMediaAttachment, SendMessageOptions, Channel } from '../types';
```
