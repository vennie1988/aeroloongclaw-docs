---
title: 媒体存储与清理
description: AeroLoongClaw 媒体文件存储、配额与清理机制
---

# 媒体存储与清理

AeroLoongClaw 的媒体存储模块为每个群组提供独立的文件存储目录，支持原子写入、SHA-256 内容去重、配额限制和基于年龄的自动清理。

源码：`src/media-store.ts`

## 存储路径

每个群组的媒体文件存储在以下路径：

```
groups/{group}/media/
```

路径通过 `resolveGroupFolderPath()` + `ensureContainerDir()` 创建，确保目录存在且属主为容器运行时用户（uid 1000），避免容器内进程出现 `EACCES` 权限错误。

## 内容去重机制

相同内容的文件不会存储两份。保存时按以下流程处理：

1. 计算文件内容的 **SHA-256 哈希**（取前 24 位字符）
2. 结合原始扩展名生成存储文件名：`{hash}{ext}`
3. 若目标路径已存在，直接返回已有路径（零写入）

```
上传文件: my-photo.jpg (内容 hash = abc123...)
存储路径: groups/my-group/media/abc123...jpg
```

这意味着即使用户上传同名文件，只要内容相同，只会占用一份磁盘空间。

## 配额限制

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `MEDIA_MAX_GROUP_STORAGE` | 单个群组媒体目录最大总容量（字节） | `524288000` (500 MB) |
| `MEDIA_MAX_FILE_SIZE` | 单个文件最大大小（字节） | `52428800` (50 MB) |

保存文件前会依次检查：

1. 单文件大小是否超过 `MEDIA_MAX_FILE_SIZE`
2. 写入后群组总用量是否超过 `MEDIA_MAX_GROUP_STORAGE`

超出配额时抛出 `Error`，不静默丢弃文件。

## 保留策略

### 自动清理

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `MEDIA_CLEANUP_MAX_AGE_DAYS` | 文件最大保留天数 | `7` 天 |
| `MEDIA_CLEANUP_INTERVAL` | 清理任务轮询间隔（毫秒） | `21600000` (6 小时) |

清理逻辑在 `cleanupOldMedia()` 中实现：

- 删除 `mtime < now - MEDIA_CLEANUP_MAX_AGE_DAYS` 的文件
- **安全窗口**：任何文件（无论是否在保留列表中）若 `mtime` 距今不足 **24 小时**，不会被删除
- 支持通过 `preservedRelativePaths` 参数保留特定文件

### 手动清理

目前 `cleanupOldMedia()` 未暴露为独立 CLI 命令，仅由主循环在 `MEDIA_CLEANUP_INTERVAL` 间隔触发。如需手动清理，可通过以下方式：

```bash
# 直接删除超过天数的文件（示例）
find groups/my-group/media/ -type f -mtime +7 -delete
```

## 文件类型限制

### 允许的 MIME 类型

图片、视频、音频（`image/`、`video/`、`audio/` 前缀）自动放行。

文档类文件需显式声明：

| MIME 类型 | 扩展名 |
|-----------|--------|
| `text/plain` | .txt |
| `text/csv` | .csv |
| `application/pdf` | .pdf |
| `application/msword` | .doc |
| `application/vnd.ms-excel` | .xls |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xlsx |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .pptx |
| `application/zip` | .zip |

### 阻止的文件类型

以下扩展名无论 MIME 类型如何均被阻止：

```
.exe .sh .bat .cmd .com .msi .ps1 .jar .dylib .so
```

## 路径遍历防护

媒体路径涉及绝对路径与相对路径的双向转换，两处均有防护：

### 相对路径 → 绝对路径（`resolveRelativeMediaPath`）

```typescript
// 禁止 .. 路径、/../ 片段、绝对路径
if (normalized.startsWith('..') || normalized.includes('/../') || path.posix.isAbsolute(normalized))
  throw new Error('Invalid relative media path');

// 必须位于 media/ 子目录
if (normalized !== MEDIA_SUBDIR && !normalized.startsWith(`${MEDIA_SUBDIR}/`))
  throw new Error('Media path must stay under media/');
```

### 绝对路径 → 相对路径（`toRelativeMediaPath`）

```typescript
const rel = path.relative(mediaDir, absolutePath);
if (rel.startsWith('..') || path.isAbsolute(rel) || rel === '')
  throw new Error('Media path is outside media directory');
```

## 查看群组存储用量

`src/media-store.ts` 导出 `getGroupMediaUsage()` 函数，读取群组 `media/` 目录并累加所有文件大小：

```typescript
import { getGroupMediaUsage, getMediaDir } from './media-store.js';

// 用量（字节）
const used = getGroupMediaUsage({ groupFolder: 'my-group' });
```

通过 `npm run status` 可查看各群组的运行时状态快照，其中包含媒体用量信息。

## 环境变量速查

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MEDIA_MAX_FILE_SIZE` | `52428800` | 单文件最大字节数 |
| `MEDIA_MAX_GROUP_STORAGE` | `524288000` | 单群组最大总存储字节数 |
| `MEDIA_CLEANUP_MAX_AGE_DAYS` | `7` | 文件保留天数 |
| `MEDIA_CLEANUP_INTERVAL` | `21600000` | 清理轮询间隔（毫秒） |
