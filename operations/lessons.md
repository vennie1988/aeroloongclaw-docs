# 部署踩坑记录

整理自 2026-03-22 首次腾讯云部署。

## 1. `dist/setup/wizard.js` 找不到

**现象**：`node /opt/aeroloongclaw/current/dist/setup/wizard.js` 报 `MODULE_NOT_FOUND`

**原因**：代码拉取后没有执行 `npm run build`，`dist/` 目录不存在或内容过旧。

**修复**：
```bash
cd <项目目录>
npm install
npm run build
```

## 2. `web:build` 失败（React 依赖缺失）

**现象**：`npm run build` 在 `web:build` 阶段报 `Cannot find module 'react'`

**原因**：生产服务器上没有安装 `web/node_modules`（Web UI 前端依赖）。`npm install` 只装主项目依赖，不会自动装 `web/` 子目录的。

**修复**：已在 `package.json` 中修改 `web:build` 脚本，当 `web/node_modules` 不存在时自动跳过：
```json
"web:build": "test -d web/node_modules || echo 'Skipping web:build (no web dependencies)' && test -d web/node_modules && npm --prefix web run build || true"
```

如果需要 Web UI，手动执行 `cd web && npm install` 后再 build。

## 3. `AEROLOONGCLAW_PROMPTS_DIR` 已废弃

**现象**：部署文档和启动命令中引用 `AEROLOONGCLAW_PROMPTS_DIR`，但代码中该环境变量已移除。

**原因**：prompts 已内嵌到 `src/channels/prompts/`，不再是可配置的外部目录。

**修复**：从所有启动命令、systemd unit、`.env` 中移除 `AEROLOONGCLAW_PROMPTS_DIR`。不影响功能。

## 4. Wizard 因企业微信频率限制中断

**现象**：Wizard 运行到发送测试消息时报 `errcode=846607, aibot send msg frequency limit exceeded`

**原因**：短时间内多次运行 wizard 或重复发消息触发企业微信发送频率限制。

**修复**：等待几分钟后重新运行 wizard。认证本身已经成功，只是测试消息被限流。

## 5. Sender policy 未设置导致启动失败

**现象**：`Startup preflight failed` — `企业微信 sender policy 不安全: channelDefaults.wecom 未设置`

**原因**：Wizard 没跑完（被频率限制中断），`sender-allowlist.json` 未自动生成。

**修复**：手动创建 sender allowlist：
```bash
sudo tee /etc/aeroloongclaw/sender-allowlist.json > /dev/null << 'EOF'
{
  "default": { "allow": "*", "mode": "trigger" },
  "channelDefaults": {
    "wecom": { "allow": ["<你的UserID>"], "mode": "drop" }
  },
  "chats": {},
  "logDenied": true
}
EOF
```

注意：
- `channelDefaults.wecom.mode` 必须是 `"drop"`（不能是 `"trigger"`）
- `allow` 数组里写允许的企业微信成员 UserID
- 需要 `"default"` 顶层字段

## 6. 消息收到但不回复（未注册群组）

**现象**：日志显示收到企业微信消息，但没有触发 agent 处理。

**原因**：两个可能的原因叠加：
1. `ASSISTANT_HAS_OWN_NUMBER=false` — 私聊也需要 `@Andy` 触发词
2. Wizard 没跑完，founder 的 DM 没有注册到 `registeredGroups`

**修复**：
```bash
# 1. 设置为 true（智能机器人是独立 bot，私聊不需要 @触发）
sudo sed -i 's/ASSISTANT_HAS_OWN_NUMBER=false/ASSISTANT_HAS_OWN_NUMBER=true/' /etc/aeroloongclaw/.env

# 2. 重新运行 wizard 完成 founder DM 注册
```

## 7. 容器内 EACCES 权限错误

**现象**：`Container agent error` — `EACCES: permission denied, mkdir '/workspace/group/.opencode'` 或 `EACCES: permission denied, mkdir '/home/node/.local/share/opencode'`

**原因**：host 上以 root 运行 systemd service，创建的目录 owner 是 root (uid 0)，但容器内以 `node` 用户（uid 1000）运行，无写权限。

**根本修复**（已在代码中实现）：
1. `setup/service.ts` 生成的 systemd unit 现在以 `aeroloongclaw` 专用用户运行（非 root）
2. `container-runner.ts` 的 `ensureContainerDir()` 创建目录后自动 chown 为 uid 1000
3. `install.sh` 已正确创建 `aeroloongclaw` 系统用户并 chown 数据目录

**临时修复**（对已有部署）：
```bash
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/groups/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/ipc/
```

**补充**：即使 host 上 `ubuntu` 用户的 uid 恰好是 1000（与容器内 `node` 一致），如果目录 mode 是 `0700`，Docker 可能因 user namespace remapping 或 SELinux/AppArmor 策略仍然拒绝访问。解决方法是 `chmod -R 755` 再 `chown -R 1000:1000`：
```bash
sudo chmod -R 755 /var/lib/aeroloongclaw/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/sessions/
```

## 8. `WECOM_CALLBACK_PORT` 旧版配置阻止启动

**现象**：`Startup preflight failed` — `企业微信存在旧版回调配置，需移除: WECOM_CALLBACK_PORT`

**原因**：Wizard 的 `LEGACY_ENV_RESET` 会把废弃的 WeCom 配置（`WECOM_CORP_ID`、`WECOM_CALLBACK_PORT` 等）以空值 `KEY=` 写入 `.env`。Health check 检测到这些 key 存在（即使空值），认为是旧版回调配置，阻止启动。

**修复**（已在代码中修复）：
1. `setup/wizard-helpers.ts` 的 `upsertEnv` 遇到空值时直接删除该行
2. `.env.example` 移除了废弃的 legacy WeCom 配置

**临时修复**（对已有部署）：
```bash
sudo sed -i '/^WECOM_CORP_ID=/d; /^WECOM_AGENT_ID=/d; /^WECOM_SECRET=/d; /^WECOM_TOKEN=/d; /^WECOM_ENCODING_AES_KEY=/d; /^WECOM_CALLBACK_PORT=/d' /etc/aeroloongclaw/.env
```

## 9. 容器 4.6 秒退出无错误日志

**现象**：容器每次启动 ~4.6 秒后退出，日志只显示 `Container completed (streaming mode)` + `Agent error, rolled back message cursor for retry`，无具体错误信息。

**原因**：默认日志级别（INFO）不会将容器的 stdout/stderr 写入容器日志文件。需要 `LOG_LEVEL=debug` 才能在容器日志中看到完整输出。

**排查方法**：
1. 在 systemd unit 中加 `Environment=LOG_LEVEL=debug`
2. 重启后触发一次容器运行
3. 查看容器日志文件：`cat $(ls -t /var/lib/aeroloongclaw/groups/*/logs/container-*.log | head -1)`

**注意**：`LOG_LEVEL` 必须设置在 `process.env` 中（systemd Environment 或 shell export），不能写在 `.env` 文件里（`.env` 文件不会加载到 `process.env`）。

## 10. heredoc EOF 不匹配

**现象**：`sudo cat > /path/file << 'EOF'` 命令不生效，终端等待输入。

**原因**：结尾的 `EOF` 前面有缩进（空格/tab），shell 匹配不到。

**修复**：用 `sudo tee` 替代，或确保 `EOF` 顶格写：
```bash
sudo tee /path/file > /dev/null << 'EOF'
内容
EOF
```

## 11. MiniMax MCP Server 启动超时导致 Agent 无响应

**现象**：容器日志显示 `Prompt timed out after 300000ms for minimax/MiniMax-M2.7`，agent 没有任何回复。

**原因**：OpenCode 在处理第一个 prompt 前需要启动所有配置的 MCP server。其中 MiniMax MCP server 使用 `uvx minimax-coding-plan-mcp` 启动，`uvx` 需要在线下载 Python 包（~7.5MB: pydantic-core, pygments, cryptography 等）。容器是临时的，每次启动都要重新下载，导致 MCP server 初始化超时，进而卡住整个 prompt 直到 300 秒超时。

**关键细节**：
- `/home/node/.local` 被 host 挂载覆盖，`uv tool install` 的默认安装目录 `~/.local/bin` 在运行时不存在
- `uvx` 缓存也因此无法命中，每次 fallback 到在线下载

**修复**（已在 Dockerfile 中实现）：
1. 在 Dockerfile 中设置 `UV_TOOL_DIR=/opt/uv-tools`（不会被 host 挂载覆盖）
2. 构建时以 node 用户预装 `minimax-coding-plan-mcp`
3. 运行时 `uvx` 自动命中 `/opt/uv-tools/` 中的已安装工具，跳过下载

**临时修复**（不重建镜像）：重建容器镜像 `./container/build.sh`

## 部署命令速查（去掉了已废弃的 PROMPTS_DIR）

**启动 Wizard**（以 aeroloongclaw 用户运行，避免权限问题）：
```bash
sudo -u aeroloongclaw \
  AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/run/user/$(id -u)/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  node <项目目录>/dist/setup/wizard.js
```

**服务管理**：
```bash
sudo systemctl start aeroloongclaw
sudo systemctl stop aeroloongclaw
sudo systemctl restart aeroloongclaw
sudo systemctl status aeroloongclaw
```

**查看日志**：
```bash
sudo tail -f /var/lib/aeroloongclaw/logs/aeroloongclaw.log
sudo tail -f /var/lib/aeroloongclaw/logs/aeroloongclaw.error.log
```

**权限修复**（一次性，修复已有的 root-owned 目录）：
```bash
sudo chmod -R 755 /var/lib/aeroloongclaw/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/groups/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/ipc/
```

**调试容器问题**：
```bash
# 启用 debug 日志
sudo systemctl edit aeroloongclaw
# 加入: [Service]\nEnvironment=LOG_LEVEL=debug
sudo systemctl daemon-reload && sudo systemctl restart aeroloongclaw

# 查看最新容器日志
cat $(ls -t /var/lib/aeroloongclaw/groups/*/logs/container-*.log | head -1)

# 手动运行容器测试
echo '{"prompt":"hello","sessionId":"test","groupFolder":"test","chatJid":"test","isMain":true,"isScheduledTask":false,"assistantName":"Andy","secrets":{},"model":"minimax/MiniMax-M2.7","skills":[],"runtimeFlags":{}}' | docker run --rm -i aeroloongclaw-agent:latest 2>&1
```

## 预防措施总结

从上述 11 个问题中提炼的通用预防规则（已在代码中实施）：

| 教训 | 预防措施 | 实施位置 |
|------|----------|----------|
| #7 容器 EACCES | 所有容器可写目录使用 `ensureContainerDir()` | `container-runner.ts` 导出，各模块调用 |
| #9 无错误日志 | 关键路径禁止空 catch；LOG_LEVEL 运行时可调 | `group-queue.ts`、`logger.ts` |
| #11 MCP 启动超时 | 构建缓存不放 bind mount 路径；UV_TOOL_DIR 重定向 | `Dockerfile` |
| #3 废弃变量 | upsertEnv 空值自动删除行 | `wizard-helpers.ts` |
| #8 旧版配置阻止启动 | 配置验证区分"key 存在"与"key 有值" | `health-checks.ts` |
| #5 sender policy | wizard 步骤失败给明确提示 | `wizard.ts` |
| #2 web:build 失败 | 构建步骤检测依赖存在性再执行 | `package.json` |
| #1 dist/ 找不到 | 容器 entrypoint 使用预编译产物 | `Dockerfile` |
