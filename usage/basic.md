---
title: 核心用法
description: AgentKernel API、kernel.run()、AgentResult、RunOptions、多步流水线、文件 I/O、流式进度。
---

# 核心用法

AeroLoongClaw Core 将容器化 Agent 执行引擎提取为独立可复用的模块。上层应用（如 OpenWork、Claude CoWork）通过 `kernel.run()` 直接编程调用，不需要消息渠道。

## 安装

```bash
# 如果使用 AeroLoongClaw 作为依赖
npm install aeroloongclaw
```

## 快速开始

```typescript
import { AgentKernel } from 'aeroloongclaw/core';

const kernel = new AgentKernel({
  dataDir: './data',
  groupsDir: './groups',
  assistantName: 'Aria',
  model: 'minimax/MiniMax-M2.7',
  containerImage: 'aeroloongclaw-agent:latest',
  secrets: { MINIMAX_API_KEY: process.env.MINIMAX_API_KEY! },
});

await kernel.init();
```

## 单次执行

```typescript
const result = await kernel.run('my-project', '分析这个数据集');

console.log(result.status);    // 'success' | 'error'
console.log(result.text);      // 文本输出
console.log(result.files);     // 文件输出 [{filename, localPath, mimeType, size}]
console.log(result.sessionId); // 会话 ID（用于多轮）
console.log(result.durationMs);// 执行耗时
```

## 多步流水线

同一个 group 的多次 `run()` 调用自动共享会话上下文：

```typescript
// Step 1: Deep Research
const research = await kernel.run('biz-analysis',
  '深度调研新能源汽车行业竞争格局',
  { skills: ['deep-research', 'web-search'] }
);

// Step 2: 分析（使用上一步的结果作为上下文）
const analysis = await kernel.run('biz-analysis',
  `基于以下研究生成战略建议：\n${research.text}`,
  { files: [{ path: '/data/interviews.docx' }] }
);

// Step 3: 生成最终交付物
const deliverable = await kernel.run('biz-analysis',
  '将分析结论整理为客户汇报 PPT 和详细报告 Word 文档',
  { skills: ['pptx', 'docx'] }
);

// 直接拿到产出的文件
for (const file of deliverable.files) {
  console.log(`${file.filename}: ${file.size} bytes at ${file.localPath}`);
  // e.g. "新能源行业分析.pptx: 524288 bytes at /path/to/groups/biz-analysis/media/xxx.pptx"
}
```

## 带文件输入（多模态）

传入的文件会自动复制到 group media 目录，并生成容器可识别的格式。
图片会作为多模态数据传给 LLM（真正的视觉理解，而非纯文本引用）。

```typescript
const result = await kernel.run('finance', '分析这份财报和趋势图', {
  files: [
    { path: '/data/q1-report.pdf', type: 'document' },
    { path: '/data/revenue-chart.png', type: 'image' },  // → LLM 多模态输入
  ],
});
```

支持的文件类型：
- **image**: jpg, png, gif, webp → LLM 视觉理解（作为 SDK file part 传入）
- **document**: pdf, docx, xlsx, pptx, txt, csv → 文本引用
- **audio**: mp3, m4a, wav, ogg → 文本引用
- **video**: mp4, mov, mkv → 文本引用（部分模型支持视觉）

文件处理细节：
- 自动复制到 `groups/{folder}/media/`（原子写入，SHA-256 去重）
- 容器内通过 `/workspace/group/media/` 路径访问
- 遵守配额限制（单文件 50MB，group 总量 500MB）
- 上层应用无需关心容器路径映射

## 流式进度

```typescript
const result = await kernel.run('analysis', '深度分析', {
  onProgress: (ev) => {
    if (ev.type === 'status') console.log(`[进度] ${ev.status}`);
    if (ev.type === 'text') console.log(`[输出] ${ev.text?.slice(0, 100)}`);
    if (ev.type === 'file') console.log(`[文件] ${ev.file!.filename}`);
  },
});
```

## 隔离任务

不继承群组会话上下文，每次全新开始：

```typescript
const result = await kernel.run('daily-report', '生成今日报告', {
  isolated: true,
});
```

## 模型覆盖

```typescript
const result = await kernel.run('premium-task', '复杂推理任务', {
  model: 'anthropic/claude-sonnet-4-6',
});
```

## AgentResult 结构

```typescript
interface AgentResult {
  text: string | null;       // 最终文本输出
  files: OutputFile[];       // 产出文件列表
  sessionId: string;         // 会话 ID
  durationMs: number;        // 耗时 (ms)
  status: 'success' | 'error';
  error?: string;            // 错误信息
}

interface OutputFile {
  type: 'document' | 'image' | 'audio' | 'video';
  mimeType: string;          // e.g. 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  filename: string;          // e.g. 'report.pptx'
  localPath: string;         // 宿主机绝对路径
  size: number;              // 字节
}
```

## RunOptions

```typescript
interface RunOptions {
  skills?: string[];         // 指定 skills
  files?: InputFile[];       // 输入文件
  model?: string;            // 模型覆盖
  sessionId?: string;        // 恢复特定会话
  timeout?: number;          // 容器超时 (ms)
  isolated?: boolean;       // 隔离任务
  onProgress?: (event: ProgressEvent) => void;  // 流式进度
}
```

## 架构

```
上层应用
  │
  ▼
AgentKernel.run(group, prompt, options)
  │
  ├── 群组管理（自动注册、会话持久化）
  ├── GroupQueue（并发控制）
  ├── ContainerRunner（容器隔离执行）
  ├── IPC FileCollector（收集产出文件）
  └── DB（SQLite，会话和状态持久化）
  │
  ▼
AgentResult { text, files, sessionId }
```

核心模块 (`src/core/`) 与渠道层 (`src/channels/`) 完全解耦。上层应用只需要 `import { AgentKernel } from 'aeroloongclaw/core'`，不需要引入任何渠道相关代码。
