---
title: 常见问题
description: AeroLoongClaw 使用中的常见问题与解答
---

# 常见问题

## 容器启动失败（EACCES 权限错误）

**现象**：`EACCES: permission denied, mkdir '/home/node/.cache/opencode'`

**原因**：Host 创建的目录属于 root，但容器内以 uid 1000 的 `node` 用户运行，无写权限。

**解决**：
- **macOS**：升级 Docker Desktop 到最新版
- **Ubuntu root 安装**：确认服务以 `aeroloongclaw` 用户而非 root 运行：
  ```bash
  sudo systemctl show aeroloongclaw | grep User=
  # 应显示 User=aeroloongclaw
  # 如需修复：
  sudo chown -R aeroloongclaw:aeroloongclaw groups/ data/
  sudo systemctl restart aeroloongclaw
  ```

---

## 消息发出去没有回复

按以下顺序排查：

1. **检查服务是否运行**
   ```bash
   # macOS
   launchctl list | grep aeroloongclaw

   # Ubuntu
   systemctl --user status aeroloongclaw
   ```

2. **检查触发词是否正确**
   - 消息必须以 `@Andy`（或你设置的 ASSISTANT_NAME）开头
   - 触发词在消息**开头**，不在中间

3. **检查 API Key 是否有效**
   ```bash
   npm run doctor
   # 查看 model_credentials 检查项
   ```

4. **查看容器是否启动**
   ```bash
   docker ps | grep aeroloongclaw-agent
   ```

---

## WeCom WebSocket 断开重连

WeCom 使用长连接（WebSocket）模式。如果连接断开：

- **自动重连**：连接会在后台自动重连，通常无需手动干预
- **如果长时间未恢复**：
  1. 检查网络和防火墙
  2. 重启服务
  3. 确认 WECOM_BOT_ID 和 WECOM_BOT_SECRET 配置正确

---

## 如何查看 Agent 正在做什么

在对话中发送数字回复 **4**，Agent 会输出当前进展。

---

## 如何停止正在运行的任务

在对话中发送数字回复 **5**，Agent 会立即停止。

---

## 如何强制重新开始

在对话中发送数字回复 **6**，Agent 会从头重新执行。

---

## 媒体文件存储在哪里

每个群组的媒体文件存储在：
```
groups/{group}/media/
```

可以在 `npm run status` 的输出中查看各群组的存储用量。

---

## 如何扩容并发数

编辑 `.env` 文件：

```bash
# 最多同时运行的容器数
MAX_CONCURRENT_CONTAINERS=10

# 每个群组最多并行的聊天任务数
PER_GROUP_MAX_PARALLEL_CHAT_RUNS=2

# 每个群组最多并行的定时任务数
PER_GROUP_MAX_PARALLEL_TASKS=2
```

修改后重启服务生效。

---

## 如何查看当前版本

```bash
# 方式 1：package.json
node -p "require('./package.json').version"

# 方式 2：Docker 镜像
docker images | grep aeroloongclaw-agent

# 方式 3：运行时日志
grep "version" logs/aeroloongclaw.log | tail -1
```

---

## 容器 idle 超时是多久

默认 **30 分钟**（`IDLE_TIMEOUT=1800000`）。

如果容器在 30 分钟内没有活动，会自动退出。可以缩短或延长：

```bash
# 编辑 .env
IDLE_TIMEOUT=600000  # 10 分钟
```

---

## SSH 断开后服务停止（Ubuntu）

**原因**：`loginctl enable-linger` 未启用。

```bash
# 检查状态
loginctl show-user $USER | grep Linger
# Linger=yes 为正常

# 如果是 no，手动启用
loginctl enable-linger
# 如果报权限错误：
sudo loginctl enable-linger $USER
```

---

## 镜像构建失败

清理 Docker 构建缓存后重试：

```bash
docker builder prune -f
./container/build.sh
```

---

## 升级后服务无法启动

1. 确认版本兼容：
   ```bash
   node -p "require('./package.json').version"
   ```

2. 回滚到上一个稳定版本：
   ```bash
   git checkout HEAD~1
   npm run build
   ./container/build.sh
   # 重启服务
   ```

3. 查看错误日志：
   ```bash
   cat logs/aeroloongclaw.error.log
   ```
