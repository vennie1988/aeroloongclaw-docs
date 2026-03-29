# 企业微信接入指南

面向 Ubuntu 部署用户，目标是在一台 Ubuntu 主机上完成 AeroLoongClaw 安装，并把它接入企业微信智能机器人。

## 适用范围

- **适用系统**：Ubuntu 22.04 / 24.04，或兼容的 Debian 系 Linux
- **适用接入方式**：企业微信智能机器人 API 模式 + 长连接
- **当前支持范围**：企业内部单聊、企业内部群聊
- **当前不支持**：外部群、客户群、旧版 URL callback 接入

## 接入前准备

### 企业微信侧准备

- 你所在企业已经开通企业微信
- 你拥有以下任一权限：
  - 企业超管
  - 管理员
  - 被授予"创建智能机器人"以及"长连接"配置权限的成员
- 你可以进入企业微信客户端的 `工作台 -> 智能机器人`

### Ubuntu 主机准备

- 一台可登录终端的 Ubuntu 主机
- 主机可以访问以下外部服务：
  - `openws.work.weixin.qq.com`
  - GitHub / GHCR
  - 你使用的大模型服务商 API
- 主机具备 Docker 运行条件
- 建议至少 2 vCPU / 4 GB RAM

### 模型凭据准备

AeroLoongClaw 需要至少一组可用的大模型凭据。常见选择：

- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY` 或 `GEMINI_API_KEY`

如果没有模型凭据，企业微信消息可以接入成功，但机器人无法真正生成回复。

### 接入结论

- 当前接入方式是长连接
- **不需要**公网 HTTPS
- **不需要**回调 URL
- **不需要** `Token`
- **不需要** `EncodingAESKey`
- **不需要**开放任何入站端口

## 标准接入流程

### 第一步：创建企业微信智能机器人

1. 打开 `工作台 -> 智能机器人`
2. 点击 `创建机器人 -> 手动创建`
3. 选择 `API 模式`
4. 在连接方式中选择 `使用长连接`
5. 保存页面生成的 `Bot ID` 和 `Secret`
6. 配置机器人的可见范围，然后完成创建

:::tip
必须选择 `API 模式 + 长连接`，不要选择旧的 URL 回调接入路径。
:::

### 第二步：安装 AeroLoongClaw

推荐使用 release 安装：

```bash
curl -fsSL https://raw.githubusercontent.com/vennie1988/aeroloongclaw/main/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --version 1.2.6
```

安装后目录布局：

- 程序目录：`/opt/aeroloongclaw/current`
- 配置目录：`/etc/aeroloongclaw`
- 运行数据：`/var/lib/aeroloongclaw`
- 服务名：`aeroloongclaw`

如果部署当前源码版本，改用源码安装：

```bash
git clone https://github.com/vennie1988/aeroloongclaw.git
cd aeroloongclaw
npm install
npm run build
npm run wizard
```

### 第三步：运行企业微信接入向导

```bash
sudo -u aeroloongclaw \
  AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/var/lib/aeroloongclaw/ipc/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  node /opt/aeroloongclaw/current/dist/setup/wizard.js
```

向导里需要填写：
- `Bot ID`
- `Bot Secret`
- `Founder UserID`

向导会自动：
- 校验长连接认证
- 发送 founder 测试消息
- 初始化 WeCom fail-closed sender policy

:::warning
不需要填写以下旧参数：`WECOM_CORP_ID`、`WECOM_AGENT_ID`、`WECOM_SECRET`、`WECOM_TOKEN`、`WECOM_ENCODING_AES_KEY`、`WECOM_CALLBACK_PORT`。
:::

## 验证与开始使用

### 检查服务状态

```bash
sudo systemctl status aeroloongclaw
```

实时看日志：

```bash
sudo journalctl -u aeroloongclaw -f
```

### 运行安装验证

```bash
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/var/lib/aeroloongclaw/ipc/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  node /opt/aeroloongclaw/current/dist/setup/index.js --step verify
```

### 运行企业微信专项诊断

```bash
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/var/lib/aeroloongclaw/ipc/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  node /opt/aeroloongclaw/current/dist/scripts/wecom-doctor.js
```

`wecom-doctor` 检查：
- WeCom 凭据是否完整
- WebSocket 长连接是否成功认证
- founder 测试消息是否可达
- sender policy 是否为 fail-closed
- 是否仍残留旧版 callback 配置

### 第一条消息验证

建议按这个顺序验证：

1. 在 founder 私聊里给机器人发一条消息
2. 确认机器人能够正常回复
3. 把机器人加入一个企业内部群
4. 在群里显式 `@AI 员工名称` 发送消息

:::tip
- 私聊是第一优先验证路径
- 企业内部群默认安静，只在被显式 `@` 时回复
- `event.enter_chat` 进入会话时会自动发送欢迎消息
:::

## 日常运维命令

### 重启服务

```bash
sudo systemctl restart aeroloongclaw
```

### 查看最新日志

```bash
sudo tail -n 200 /var/lib/aeroloongclaw/logs/aeroloongclaw.log
sudo tail -n 200 /var/lib/aeroloongclaw/logs/aeroloongclaw.error.log
```

### 系统级诊断

```bash
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/var/lib/aeroloongclaw/ipc/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  npm --prefix /opt/aeroloongclaw/current run doctor -- --json
```

### 备份状态

```bash
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_AUDIT_DIR=/var/lib/aeroloongclaw/audit \
  AEROLOONGCLAW_SESSIONS_DIR=/var/lib/aeroloongclaw/sessions \
  AEROLOONGCLAW_IPC_DIR=/var/lib/aeroloongclaw/ipc/aeroloongclaw \
  AEROLOONGCLAW_CACHE_DIR=/var/cache/aeroloongclaw \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  npm --prefix /opt/aeroloongclaw/current run backup:state
```

## 常见问题

### 1. 还需要配置公网 HTTPS、域名或反向代理吗？

不需要。当前企业微信接入方式是宿主机主动发起的 WebSocket 长连接，不再依赖 callback。

### 2. 长连接接入和旧版 URL callback 接入有什么区别？

对 AeroLoongClaw 当前版本来说，长连接是唯一推荐方式：
- 不需要公网入口
- 不需要域名备案
- 不需要回调验签参数
- 更适合 Ubuntu 云主机和内网环境

### 3. 谁可以创建并接入这个机器人？

企业超管、管理员，或者被授予"创建智能机器人"和"长连接配置"权限的成员都可以。

### 4. 如果机器人不回复，优先检查什么？

按这个顺序排查：

1. `sudo systemctl status aeroloongclaw`
2. `wecom-doctor`
3. 模型凭据是否已配置
4. founder 测试消息是否成功
5. sender policy 是否为 fail-closed
6. 群里是否有显式 `@AI 员工`

### 5. 可以在外部群 / 客户群里使用吗？

当前不支持。

### 6. 能识别图片、文件、语音吗？

支持接收图片、文件、语音等附件消息，但最终能否有效理解附件，取决于你配置的模型是否具备相应能力。

### 7. `wecom-doctor` 提示 sender policy 不安全，怎么修？

release 安装默认路径是 `/etc/aeroloongclaw/sender-allowlist.json`。确保文件中存在：

```json
{
  "default": { "allow": "*", "mode": "trigger" },
  "channelDefaults": {
    "wecom": { "allow": [], "mode": "drop" }
  },
  "chats": {},
  "logDenied": true
}
```

向导通常会自动写入这项配置；只有手工改坏、从旧配置升级、或跳过向导时，才需要手工修复。

## 手工配置方式

如果不想通过向导，最少需要这些 WeCom 配置：

```dotenv
WECOM_ENABLED=true
WECOM_BOT_ID=你的 Bot ID
WECOM_BOT_SECRET=你的 Bot Secret
WECOM_FOUNDER_USER_ID=你的 founder UserID
WECOM_WEBSOCKET_URL=wss://openws.work.weixin.qq.com
```

:::warning
不要再写入这些旧变量：
```dotenv
WECOM_CORP_ID=
WECOM_AGENT_ID=
WECOM_SECRET=
WECOM_TOKEN=
WECOM_ENCODING_AES_KEY=
WECOM_CALLBACK_PORT=
```
如果这些旧变量仍然残留，`wecom-doctor` 会把它们识别为 legacy 配置问题。
:::
