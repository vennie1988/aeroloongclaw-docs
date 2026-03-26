---
title: Skills 能力清单
description: AeroLoongClaw 77+ 内置 Skills 完整参考
---

# Skills 能力清单

Skills 是 Agent 在容器内按需加载的能力模块。以下是完整清单：

## 核心能力（12 个）

| Skill | 说明 |
|-------|------|
| `browser` | 浏览器操作（打开网页、截图、提取数据） |
| `data-analysis` | CSV/数据集分析与可视化 |
| `deep-research` | 多源深度调研（综合多个信息源） |
| `web-search` | 网络搜索（MiniMax MCP） |
| `image-understanding` | 图片分析理解（MiniMax MCP） |
| `document-generation` | 通用文档生成 |
| `docx` | Word 文档创建 |
| `xlsx` | Excel 表格创建（含公式） |
| `pdf` | PDF 文档创建 |
| `pptx` | PowerPoint 演示文稿创建 |
| `memory-management` | 长期记忆读写 |
| `scheduled-tasks` | 定时任务管理 |

## 多媒体创作（4 个）

| Skill | 说明 | 输出格式 |
|-------|------|---------|
| `speech-synthesis` | 文本转语音（TTS） | MP3 |
| `image-generation` | 文生图 | PNG |
| `video-generation` | 文生视频 | MP4 |
| `music-generation` | 作曲/纯音乐 | MP3 |

## 业务能力（15 个）

| Skill | 说明 |
|-------|------|
| `identity-positioning` | 身份合规定位 |
| `meeting-notes` | 会议纪要整理 |
| `internal-comms` | 内部沟通文档（3P 报告等） |
| `proactive-reporting` | 主动日报生成 |
| `doc-coauthoring` | 文档协作 |
| `algorithmic-art` | 算法艺术（p5.js） |
| `canvas-design` | 海报/画布设计 |
| `theme-factory` | 主题模板工厂 |
| `mcp-builder` | MCP Server 设计指导 |
| `skill-creator` | 自定义 Skill 创建 |
| `skill-management` | Skill 安装/移除管理 |
| `authorization-audit-rollback` | 授权审计回滚 |
| `authorization-status` | 授权状态查询 |
| `system-status` | 系统状态查看 |
| `debug-guide` | 调试指南 |

## 行业插件（60 个）

通过 [Anthropic Knowledge Work Plugins](https://github.com/anthropics/knowledge-work-plugins) 安装：

| 领域 | 数量 | 示例 Skills |
|------|------|-------------|
| Data & Analytics | 10 | `data--sql-queries`, `data--build-dashboard`, `data--statistical-analysis` |
| Sales | 9 | `sales--pipeline-review`, `sales--call-prep`, `sales--forecast` |
| Operations | 9 | `operations--process-doc`, `operations--risk-assessment`, `operations--runbook` |
| Marketing | 8 | `marketing--seo-audit`, `marketing--campaign-plan`, `marketing--content-creation` |
| Finance | 8 | `finance--variance-analysis`, `finance--journal-entry`, `finance--reconciliation` |
| Product Management | 7 | `product-management--write-spec`, `product-management--sprint-planning` |
| Customer Support | 5 | `customer-support--ticket-triage`, `customer-support--draft-response` |
| Productivity | 4 | `productivity--task-management`, `productivity--start` |

---

## 安装 Skills

### 从 ClawHub 安装

```bash
npm run skill:install <slug>
```

### 从 GitHub 安装

```bash
npm run skill:install github:owner/repo/path
```

### 查看已安装 Skills

```bash
npm run skill:install -- --list
```

### 移除 Skill

```bash
npm run skill:install -- --remove <name>
```

---

## SKILL.md 格式

每个 Skill 是一个 `SKILL.md` 文件，支持以下格式：

```yaml
---
name: voice-transcription      # ^[a-z0-9]+(-[a-z0-9]+)*$，1-64 字符
description: "一句话描述"       # 1-1024 字符
metadata:                       # 可选，string-to-string ONLY（不能嵌套）
  requires: "OPENAI_API_KEY"
---
# Markdown 内容
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | Skill 名称，格式 `^[a-z0-9]+(-[a-z0-9]+)*$`，1-64 字符 |
| `description` | string | ✅ | 一句话描述，1-1024 字符 |
| `metadata` | object | ❌ | 元数据，key-value 形式（不能嵌套） |

---

## Skill 分类

### 浏览器与搜索

- `browser` — 浏览器操作（打开网页、截图、提取数据）
- `web-search` — 网络搜索（MiniMax MCP）
- `image-understanding` — 图片分析理解

### 数据处理

- `data-analysis` — CSV/数据集分析与可视化
- `xlsx` — Excel 表格创建（含公式）
- `pdf` — PDF 文档创建
- `docx` — Word 文档创建
- `pptx` — PowerPoint 演示文稿创建

### 多媒体生成

- `speech-synthesis` — 文本转语音（TTS）
- `image-generation` — 文生图
- `video-generation` — 文生视频
- `music-generation` — 作曲/纯音乐

### 深度任务

- `deep-research` — 多源深度调研
- `document-generation` — 通用文档生成
- `meeting-notes` — 会议纪要整理

### 系统管理

- `scheduled-tasks` — 定时任务管理
- `memory-management` — 长期记忆读写
- `skill-management` — Skill 安装/移除管理
- `skill-creator` — 自定义 Skill 创建

---

## 使用示例

### 指定特定 Skills

```typescript
const result = await kernel.run('finance', '分析财报', {
  skills: ['data-analysis', 'xlsx', 'finance--variance-analysis'],
});
```

### 不加载任何 Skill

```typescript
const result = await kernel.run('chat', '纯文本对话', { skills: [] });
```

### 在 CLI 中使用

```bash
# 默认加载所有可用 Skills
aeroloongclaw run my-project "分析市场趋势"

# 指定 Skills
aeroloongclaw run my-project "分析财报" --file data.csv
```
