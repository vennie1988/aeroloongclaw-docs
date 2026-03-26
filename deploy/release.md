# Release 安装说明

## 适用范围

这份安装路径用于 release 包交付，不走 `git clone`。

支持的平台：
- Ubuntu / Debian Linux
- macOS
- Linux `x86_64`
- Linux `aarch64`
- macOS `x86_64`
- macOS `arm64`

明确不支持：
- OpenCloudOS（所有版本）
- 通用 RHEL 系
- Alpine
- macOS 上的 Apple Container release 安装路径

## 设计原则

- 主程序运行在宿主机
- agent 继续运行在容器里
- release 安装只负责程序、service 和运行目录
- 企业微信智能机器人使用宿主机主动发起的长连接，不需要公网 HTTPS callback
- 版本必须显式 pin，不默认使用 `latest`

## 目录布局

### Linux（systemd）

```
/opt/aeroloongclaw/releases/<version>
/opt/aeroloongclaw/current
/etc/aeroloongclaw/.env
/etc/aeroloongclaw/mount-allowlist.json
/etc/aeroloongclaw/sender-allowlist.json
/var/lib/aeroloongclaw/store
/var/lib/aeroloongclaw/data
/var/lib/aeroloongclaw/groups
/var/lib/aeroloongclaw/custom-skills
/var/lib/aeroloongclaw/logs
```

### macOS（launchd，当前用户）

```
~/Library/Application Support/AeroLoongClaw/releases/<version>
~/Library/Application Support/AeroLoongClaw/current
~/Library/Application Support/AeroLoongClaw/config/.env
~/Library/Application Support/AeroLoongClaw/store
~/Library/Application Support/AeroLoongClaw/data
~/Library/Application Support/AeroLoongClaw/groups
~/Library/Application Support/AeroLoongClaw/custom-skills
~/Library/Application Support/AeroLoongClaw/logs
~/Library/LaunchAgents/com.aeroloongclaw.plist
```

## 安装

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/vennie1988/aeroloongclaw/main/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --version 1.2.6
```

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/vennie1988/aeroloongclaw/main/install.sh -o install.sh
chmod +x install.sh
./install.sh --version 1.2.6
```

:::tip
使用 `--dry-run` 预览安装动作，不做任何修改：
```bash
sudo ./install.sh --version 1.2.6 --dry-run
```
:::

### 安装器行为

**Linux 安装器**：
- 检测发行版和架构
- 安装 Node 20、Docker、curl、tar、git、python3、make、g++
- 创建 `aeroloongclaw` 系统用户并加入 `docker` 组
- 下载 GitHub Release tarball
- 安装生产依赖
- 拉取 `ghcr.io/vennie1988/aeroloongclaw-agent:<version>`
- 写入 systemd unit（以 `aeroloongclaw` 用户运行，非 root）
- 初始化 `/etc/aeroloongclaw/.env`
- 将数据目录 chown 给 `aeroloongclaw` 用户

:::important
Linux 上 systemd service 以专用 `aeroloongclaw` 用户运行，不以 root 运行。这确保宿主进程创建的目录与容器内 `node` 用户（uid 1000）兼容，避免权限问题。
:::

**macOS 安装器**：
- 拒绝 `sudo` / root 执行，要求当前用户安装
- 检查 Homebrew，并按需安装 Node 20 等 CLI 依赖
- 检查 Docker Desktop，必要时尝试唤起并等待就绪
- 下载 GitHub Release tarball
- 安装生产依赖
- 拉取 `ghcr.io/vennie1988/aeroloongclaw-agent:<version>`
- 初始化 `~/Library/Application Support/AeroLoongClaw/config/.env`
- 写入并加载 `~/Library/LaunchAgents/com.aeroloongclaw.plist`

## 用户权限模型

AeroLoongClaw 在 Linux 上涉及三个用户身份：

| 用户 | 用途 | 说明 |
|------|------|------|
| `root` | 安装和系统级操作 | 仅用于安装，不运行 wizard 或主进程 |
| `aeroloongclaw` | 服务用户，运行主进程和 wizard | 专用服务账号，uid 1000 |
| `node` | 容器内用户 | uid 1000，与 aeroloongclaw 用户兼容 |

### 权限问题快速修复

如果已有部署是 root 运行导致目录权限不对：

```bash
# 修复目录权限（一次性）
sudo chmod -R 755 /var/lib/aeroloongclaw/data/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/groups/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/data/sessions/
sudo chown -R 1000:1000 /var/lib/aeroloongclaw/data/ipc/
```

## 升级

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/vennie1988/aeroloongclaw/main/upgrade.sh -o upgrade.sh
chmod +x upgrade.sh
sudo ./upgrade.sh --version 1.2.7
```

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/vennie1988/aeroloongclaw/main/upgrade.sh -o upgrade.sh
chmod +x upgrade.sh
./upgrade.sh --version 1.2.7
```

升级器会：
- 下载新版本到 `releases/<version>`
- 安装生产依赖
- 拉取新 agent 镜像
- 切换 `current` 软链
- 重启对应平台的 service
- 运行 `verify`、`doctor` 和 `wecom-doctor`
- 失败时回滚 `current` 软链

## 首次接入

安装完成后，建议按这个顺序继续：

1. 运行企业微信接入向导
2. 运行 `verify` 和 `wecom-doctor`
3. 在 founder 私聊和企业内部群里完成第一条消息验证

详细步骤见 [企业微信接入指南](/channels/wecom)。

## 备份与恢复

### 备份

```bash
# Linux
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_DATA_DIR=/var/lib/aeroloongclaw/data \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  npm --prefix /opt/aeroloongclaw/current run backup:state
```

备份默认写入 `${AEROLOONGCLAW_DATA_DIR}/backups/<timestamp>/`，包含 `manifest.json` 和一致性 SQLite 备份。

### 恢复

:::warning
恢复前必须先停服务。`restore:state` 会先自动做一份 pre-restore 备份，完成后不会自动拉起服务。
:::

```bash
# Linux
sudo systemctl stop aeroloongclaw
sudo AEROLOONGCLAW_ENV_FILE=/etc/aeroloongclaw/.env \
  AEROLOONGCLAW_STORE_DIR=/var/lib/aeroloongclaw/store \
  AEROLOONGCLAW_DATA_DIR=/var/lib/aeroloongclaw/data \
  AEROLOONGCLAW_GROUPS_DIR=/var/lib/aeroloongclaw/groups \
  AEROLOONGCLAW_CUSTOM_SKILLS_DIR=/var/lib/aeroloongclaw/custom-skills \
  AEROLOONGCLAW_LOGS_DIR=/var/lib/aeroloongclaw/logs \
  AEROLOONGCLAW_MOUNT_ALLOWLIST_PATH=/etc/aeroloongclaw/mount-allowlist.json \
  AEROLOONGCLAW_SENDER_ALLOWLIST_PATH=/etc/aeroloongclaw/sender-allowlist.json \
  npm --prefix /opt/aeroloongclaw/current run restore:state -- --from /var/lib/aeroloongclaw/data/backups/<timestamp> --dry-run
```

## 卸载

### 自动卸载

```bash
# Linux — 预演
sudo ./uninstall.sh --dry-run

# Linux — 完全卸载
sudo ./uninstall.sh

# Linux — 保留数据
sudo ./uninstall.sh --keep-data
```

### 卸载操作表

| 步骤 | Linux | macOS |
|------|-------|-------|
| 停止服务 | `systemctl stop/disable aeroloongclaw` | `launchctl unload` |
| 删除服务配置 | `/etc/systemd/system/aeroloongclaw.service` | `~/Library/LaunchAgents/com.aeroloongclaw.plist` |
| 删除 Docker 镜像 | `docker rmi aeroloongclaw-agent:*` | 同左 |
| 删除程序文件 | `/opt/aeroloongclaw` | `~/Library/Application Support/AeroLoongClaw/releases` |
| 删除配置 | `/etc/aeroloongclaw` | `~/Library/Application Support/AeroLoongClaw/config` |
| 删除运行数据 | `/var/lib/aeroloongclaw` | `~/Library/Application Support/AeroLoongClaw` |
| 删除系统用户 | `userdel aeroloongclaw` | 不适用 |
