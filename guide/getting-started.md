---
title: 快速开始
description: 5 分钟内启动你的第一个 AI 员工。
---

# 快速开始

5 分钟内启动你的 AI 员工。

## 前置条件

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 20+ | 推荐 22 LTS |
| Docker | 24+ | macOS 需要 Docker Desktop |
| Git | 2.0+ | 克隆代码 |

还需要至少一个 AI 模型的 API Key（MiniMax、Anthropic、OpenAI 或 Google）。

## 第一步：克隆并安装

```bash
git clone https://github.com/vennie1988/aeroloongclaw.git
cd aeroloongclaw
npm install
```

## 第二步：运行安装向导

```bash
npm run wizard
```

向导会引导你完成全部配置：

1. **检查环境** -- 自动检测平台和 Docker
2. **配置 API Key** -- 选择 AI 提供商并输入凭据
3. **构建容器镜像** -- 首次约 2-5 分钟
4. **配置渠道** -- Web UI 默认启用
5. **注册群组** -- 创建第一个工作群组
6. **安装服务** -- 注册为系统服务，开机自启

::: tip
向导设计为可安全重复运行。如果中途中断，重新执行 `npm run wizard` 即可。
:::

## 第三步：发送第一条消息

向导完成后，Web UI 默认在 `http://127.0.0.1:3100` 启动。

通过 API 发送测试消息：

```bash
# 从日志中获取 Web UI Token
grep "Web UI" logs/aeroloongclaw.log | tail -1

# 发送消息
curl -X POST http://127.0.0.1:3100/api/web/messages \
  -H "Authorization: Bearer <你的TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好，自我介绍一下", "sessionId": "test"}'
```

也可以直接在浏览器中打开 `http://127.0.0.1:3100` 使用 Web UI。

## 第四步：验证系统状态

```bash
# 系统健康检查
npm run doctor

# 运行时状态
npm run status
```

`npm run doctor` 会检查环境、容器运行时、数据库和服务状态，确保一切正常。

## 下一步

你的 AI 员工已经在运行了。接下来可以：

- **[详细安装指南](./installation)** -- macOS / Ubuntu 的完整安装流程、服务管理、卸载方法
- **[核心概念](./concepts)** -- 理解群组隔离、容器生命周期、IPC 机制等架构原理
- **[基础用法](/usage/basic)** -- 学习 API 调用、CLI 命令和 SDK 集成
- **[渠道配置](/channels/)** -- 配置企业微信、Web UI 等消息渠道
