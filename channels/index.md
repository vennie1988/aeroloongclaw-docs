---
title: 消息渠道
description: AeroLoongClaw 支持的消息渠道概览
---

# 消息渠道

AeroLoongClaw 通过消息渠道与用户交互。目前支持以下渠道：

## 可用渠道

| 渠道 | 状态 | 说明 |
|------|------|------|
| [企业微信](./wecom) | 稳定 | 企业微信智能机器人，长连接模式 |
| [Web UI](./web-ui) | 稳定 | 浏览器访问，本地 HTTP 服务 |

## 渠道架构

渠道在 `src/channels/` 目录下实现，采用**自注册模式**：

```typescript
// 导入时自动注册
import './channels/wecom';
import './channels/web';
```

配置对应的环境变量后，渠道自动启用。

## 选择渠道

- **个人/小团队**：Web UI 最简单，浏览器即可访问
- **企业用户**：企业微信集成，适合公司内部协作

详细配置请参阅各渠道专属文档。
