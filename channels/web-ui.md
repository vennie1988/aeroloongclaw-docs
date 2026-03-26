# Web UI 使用指南

Web UI 是 AeroLoongClaw 提供的本地测试聊天界面，用于验证系统功能和手动触发 agent 任务。

## 启用 Web UI

Web UI 默认启用，绑定在 `127.0.0.1:3100`。

### 配置环境变量

```dotenv
# 是否启用 Web UI（默认 true）
WEB_UI_ENABLED=true

# 绑定主机地址（默认 127.0.0.1，仅本机访问）
WEB_UI_HOST=127.0.0.1

# 监听端口（默认 3100）
WEB_UI_PORT=3100

# 访问令牌（留空则启动时自动生成）
WEB_UI_TOKEN=
```

:::tip
如果 `WEB_UI_TOKEN` 留空，启动时会自动生成一个 token 并在日志中显示（masked）。搜索日志中的 `Web UI` 关键字找到 token。
:::

## 打开聊天界面

在浏览器中访问：

```
http://127.0.0.1:3100
```

首次访问需要输入 Access Token。

## 功能特性

### 发送消息

在输入框中输入消息，点击发送或按 `Enter` 键。Agent 会通过 SSE（Server-Sent Events）流式返回响应。

### 文件上传

Web UI 支持上传文件作为附件。点击附件按钮选择文件，文件会随消息一起发送。

### SSE 流式响应

Agent 的响应通过 SSE 流式传输，界面会实时显示 agent 的思考过程和回复内容。

## 健康检查

```bash
curl http://127.0.0.1:3100/health
```

## 通过 API 发送测试消息

```bash
curl -X POST http://127.0.0.1:3100/api/web/messages \
  -H "Authorization: Bearer <你的WEB_UI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "sessionId": "test-session"}'
```

## 安全说明

:::warning
Web UI 默认绑定 `127.0.0.1`，仅本机可访问。不要将其暴露到公网。
:::

如果需要远程访问：
1. 配置反向代理（如 nginx）
2. 启用 HTTPS
3. 设置强访问令牌
4. 配置防火墙规则
