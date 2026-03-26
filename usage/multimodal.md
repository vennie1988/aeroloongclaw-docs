---
title: 多模态生成
description: TTS、图片、视频、音乐生成能力详解
---

# 多模态生成

Agent 可通过 4 个 IPC MCP 工具生成多媒体内容。这些在 `kernel.run()` 的 prompt 中通过自然语言触发，生成的文件会自动收集到 `AgentResult.files`。

:::warning
**重要**：多模态生成需要 `MINIMAX_API_KEY`，且需在 `secrets` 中传入。
:::

---

## 语音合成（TTS）

将文本转换为语音输出。

### 基本用法

```typescript
const result = await kernel.run('media', '把以下文本转成语音：\n"欢迎使用 AeroLoongClaw"', {
  skills: ['speech-synthesis'],
  timeout: 180_000,
});
// result.files[0] → { filename: 'xxx.mp3', mimeType: 'audio/mpeg', ... }
```

### 输出格式

| 字段 | 值 |
|------|-----|
| `type` | `audio` |
| `mimeType` | `audio/mpeg` |
| `filename` | `xxx.mp3` |

### 典型耗时

10-30 秒

### 适用场景

- 有声读物朗读
- 播报内容生成
- 语音助手回复
- 视频配音

---

## 图片生成

根据文本描述生成图片。

### 基本用法

```typescript
const result = await kernel.run('media', '生成一张图片：一只橘猫坐在窗台上，水彩画风格，1:1 比例', {
  skills: ['image-generation'],
});
// result.files[0] → { filename: 'xxx.png', mimeType: 'image/png', ... }
```

### 输出格式

| 字段 | 值 |
|------|-----|
| `type` | `image` |
| `mimeType` | `image/png` |
| `filename` | `xxx.png` |

### 典型耗时

5-15 秒

### 适用场景

- 插画配图生成
- 产品概念图
- 营销素材制作
- UI/UX 设计稿

### 提示技巧

- 尽量详细描述画面内容、风格、构图
- 可指定比例（如 `1:1`、`16:9`）
- 可指定艺术风格（如 `水彩画`、`油画`、`动漫`）

---

## 视频生成

根据文本描述生成短视频。

### 基本用法

```typescript
const result = await kernel.run('media', '生成一段短视频：一杯咖啡在木桌上，蒸汽缓缓升起，电影质感', {
  skills: ['video-generation'],
  timeout: 420_000,  // 视频生成较慢，建议 5-7 分钟超时
});
// result.files[0] → { filename: 'xxx.mp4', mimeType: 'video/mp4', ... }
```

### 输出格式

| 字段 | 值 |
|------|-----|
| `type` | `video` |
| `mimeType` | `video/mp4` |
| `filename` | `xxx.mp4` |

### 典型耗时

60-300 秒（1-5 分钟）

:::warning
视频生成是异步任务，请设置足够的 `timeout`（建议 300-420 秒）。
:::

### 适用场景

- 社交媒体短视频
- 产品展示视频
- 概念演示
- 动态内容创作

---

## 音乐生成

根据文本描述生成纯音乐。

### 基本用法

```typescript
const result = await kernel.run('media', '创作一首轻快的钢琴纯音乐，适合工作背景', {
  skills: ['music-generation'],
  timeout: 300_000,
});
// result.files[0] → { filename: 'xxx.mp3', mimeType: 'audio/mpeg', ... }
```

### 输出格式

| 字段 | 值 |
|------|-----|
| `type` | `audio` |
| `mimeType` | `audio/mpeg` |
| `filename` | `xxx.mp3` |

### 典型耗时

30-120 秒

### 适用场景

- 背景音乐制作
- 播客配乐
- 视频背景音
- 氛围音乐生成

---

## 统一使用流程

### 1. 配置 Secrets

确保 `MINIMAX_API_KEY` 在 `secrets` 中：

```typescript
const kernel = new AgentKernel({
  // ...
  secrets: {
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY!,
  },
});
```

### 2. 调用 kernel.run()

```typescript
const result = await kernel.run('media', '生成一段短视频：一杯咖啡在木桌上', {
  skills: ['video-generation'],
  timeout: 420_000,
});
```

### 3. 处理输出文件

```typescript
for (const file of result.files) {
  console.log(`文件: ${file.filename}`);
  console.log(`类型: ${file.mimeType}`);
  console.log(`大小: ${file.size} bytes`);
  console.log(`路径: ${file.localPath}`);
}
```

---

## 错误处理

### 常见错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1008 | 余额不足 | 充值 MiniMax 账户 |
| 1026 | 内容敏感 | 修改 prompt，避免敏感内容 |
| 超时 | 生成时间过长 | 增加 `timeout` 值 |

### 调试方法

```typescript
const result = await kernel.run('media', '生成图片', {
  skills: ['image-generation'],
  timeout: 60_000,
  onProgress: (event) => {
    if (event.type === 'status') {
      console.log(`进度: ${event.status}`);
    }
  },
});

if (result.status === 'error') {
  console.error(`生成失败: ${result.error}`);
}
```

---

## 性能对比

| 模态 | 典型耗时 | 建议 timeout |
|------|---------|--------------|
| TTS | 10-30s | 180s |
| 图片生成 | 5-15s | 60s |
| 视频生成 | 60-300s | 420s |
| 音乐生成 | 30-120s | 300s |

---

## MiniMax 多模态客户端

AeroLoongClaw 使用 MiniMax 的多模态生成能力。底层通过 `MiniMaxClient` 调用 `api.minimaxi.com` 的 Anthropic 兼容接口。

支持的生成能力：

- **T2A** (Text to Audio) — 语音合成
- **I2A** (Image to Audio) — 图片配音
- **I2V** (Image to Video) — 图片转视频
- **T2V** (Text to Video) — 文生视频
- **T2M** (Text to Music) — 文生音乐

详细 API 文档参考 [MiniMax 官方文档](https://www.minimaxi.com/)。
