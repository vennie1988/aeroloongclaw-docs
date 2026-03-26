# 调试清单

## 已知问题

### 1. IDLE_TIMEOUT == CONTAINER_TIMEOUT（均为 30 分钟）

两个定时器同时触发，导致容器总是以 hard SIGKILL（code 137）退出，而不是通过 graceful `_close` sentinel 关闭。空闲超时应该更短（例如 5 分钟），让容器在消息间隔之间关闭，而容器超时保持 30 分钟作为卡住 agent 的安全网。

### 2. Cursor 在 agent 成功前推进

`processGroupMessages` 在 agent 运行**之前**就推进了 `lastAgentTimestamp`。如果容器超时，重试会找不到消息（cursor 已经跳过）。消息在超时时会永久丢失。

### 3. 恢复分支从陈旧树位置开始

当 agent team 生成 subagent CLI 进程时，它们写入同一个 session JSONL。后续 `query()` 恢复时，CLI 可能选择一个陈旧的分支tip（从 subagent 活动之前），导致 agent 的响应落在 host 从未收到 `result` 的分支上。**修复**：传递 `resumeSessionAt` 与上一个 assistant message UUID 来显式锚定每次恢复。

## 快速状态检查

```bash
# 1. 服务是否在运行？
launchctl list | grep aeroloongclaw
# 预期：PID  0  com.aeroloongclaw（PID = 运行中，- = 未运行，非零退出 = 崩溃）

# 2. 有运行中的容器吗？
docker ls --format '{{.Names}} {{.Status}}' 2>/dev/null | grep aeroloongclaw

# 3. 有停止/孤立的容器吗？
docker ls -a --format '{{.Names}} {{.Status}}' 2>/dev/null | grep aeroloongclaw

# 4. 服务日志中最近的错误？
grep -E 'ERROR|WARN' logs/aeroloongclaw.log | tail -20

# 5. 群组是否已加载？
grep 'groupCount' logs/aeroloongclaw.log | tail -3
```

## Session 分支调试

```bash
# 检查 session debug 日志中的并发 CLI 进程
ls -la data/sessions/<group>/.claude/debug/

# 统计处理消息的唯一 SDK 进程数
# 每个 .txt 文件 = 一个 CLI 子进程。多个 = 并发查询。

# 检查 transcript 中的 parentUuid 分支
python3 -c "
import json, sys
lines = open('data/sessions/<group>/.claude/projects/-workspace-group/<session>.jsonl').read().strip().split('\n')
for i, line in enumerate(lines):
  try:
    d = json.loads(line)
    if d.get('type') == 'user' and d.get('message'):
      parent = d.get('parentUuid', 'ROOT')[:8]
      content = str(d['message'].get('content', ''))[:60]
      print(f'L{i+1} parent={parent} {content}')
  except: pass
"
```

## 容器超时排查

```bash
# 检查最近的超时
grep -E 'Container timeout|timed out' logs/aeroloongclaw.log | tail -10

# 检查超时容器的容器日志文件
ls -lt groups/*/logs/container-*.log | head -10

# 读取最新的容器日志（替换路径）
cat groups/<group>/logs/container-<timestamp>.log

# 检查是否安排了重试以及发生了什么
grep -E 'Scheduling retry|retry|Max retries' logs/aeroloongclaw.log | tail -10
```

## Agent 无响应

```bash
# 检查是否收到消息
grep 'New messages' logs/aeroloongclaw.log | tail -10

# 检查消息是否正在处理（容器是否生成）
grep -E 'Processing messages|Spawning container' logs/aeroloongclaw.log | tail -10

# 检查消息是否被输送到活跃容器
grep -E 'Piped messages|sendMessage' logs/aeroloongclaw.log | tail -10

# 检查队列状态 — 有活跃容器吗？
grep -E 'Starting container|Container active|concurrency limit' logs/aeroloongclaw.log | tail -10

# 检查 lastAgentTimestamp vs 最新消息时间戳
sqlite3 store/messages.db "SELECT chat_jid, MAX(timestamp) as latest FROM messages GROUP BY chat_jid ORDER BY latest DESC LIMIT 5;"
```

## 容器挂载问题

```bash
# 检查挂载验证日志（容器生成时显示）
grep -E 'Mount validated|Mount.*REJECTED|mount' logs/aeroloongclaw.log | tail -10

# 验证挂载白名单可读
cat ~/.config/aeroloongclaw/mount-allowlist.json

# 检查 DB 中的群组 container_config
sqlite3 store/messages.db "SELECT name, container_config FROM registered_groups;"

# 测试运行容器检查挂载（dry run）
docker run -i --rm --entrypoint ls aeroloongclaw-agent:latest /workspace/extra/
```

## 服务管理命令

```bash
# 重启服务
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw

# 实时查看日志
tail -f logs/aeroloongclaw.log

# 停止服务（小心 — 运行中的容器是 detached，不会被 kill）
launchctl bootout gui/$(id -u)/com.aeroloongclaw

# 启动服务
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aeroloongclaw.plist

# 重建后重启
npm run build && launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```
