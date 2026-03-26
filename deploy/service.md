# Service 管理

AeroLoongClaw 安装后作为系统服务运行，支持开机自启和崩溃自动重启。

## macOS (launchd)

### 查看服务状态

```bash
launchctl list | grep aeroloongclaw
# 输出格式：PID  ExitStatus  Label
# 例如：12345  0  com.aeroloongclaw    ← 正常运行
#        -     78 com.aeroloongclaw    ← 崩溃循环（无 PID + 非零退出码）
```

### 重启服务

```bash
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```

### 停止服务

:::warning
注意 — 运行中的容器是 detached 模式，不会被 kill
:::

```bash
launchctl bootout gui/$(id -u)/com.aeroloongclaw
```

### 启动服务

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aeroloongclaw.plist
```

### 重建服务（代码更新后）

```bash
npm run build && launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```

## Ubuntu (systemd)

Ubuntu 有两种运行模式：

- **普通用户安装**（推荐）— 使用 `systemctl --user`，无需 root
- **root 安装**（生产环境）— 创建专用 `aeroloongclaw` 系统用户

### 普通用户安装（systemctl --user）

```bash
# 查看服务状态
systemctl --user status aeroloongclaw

# 重启服务
systemctl --user restart aeroloongclaw

# 查看实时日志
journalctl --user -u aeroloongclaw -f

# 也可以直接看日志文件
tail -f logs/aeroloongclaw.log           # JSON 格式
tail -f logs/aeroloongclaw.error.log     # 人类可读格式
```

### root 安装（systemctl）

```bash
# 查看服务状态
sudo systemctl status aeroloongclaw

# 重启服务
sudo systemctl restart aeroloongclaw

# 查看实时日志
sudo journalctl -u aeroloongclaw -f
```

## 服务文件位置

| 项目 | macOS | Ubuntu 普通用户 | Ubuntu root 安装 |
|------|-------|-----------------|-----------------|
| systemd/launchd 配置 | `~/Library/LaunchAgents/com.aeroloongclaw.plist` | `~/.config/systemd/user/aeroloongclaw.service` | `/etc/systemd/system/aeroloongclaw.service` |
| 主日志（JSON） | `logs/aeroloongclaw.log` | `logs/aeroloongclaw.log` | `logs/aeroloongclaw.log` |
| 错误日志（可读） | `logs/aeroloongclaw.error.log` | `logs/aeroloongclaw.error.log` | `logs/aeroloongclaw.error.log` |
| 环境配置 | `.env` | `.env` | `.env` |

## Docker 组 stale session 问题

如果向导报告 `Docker group not active in systemd session`：

```
Docker group not active in systemd session — user was likely added to docker group mid-session
```

**原因**：你在当前会话中被加入了 docker 组，终端里 `docker` 命令可以正常使用，但 systemd 的 user session 还不知道这个变更。服务启动后容器可能无法创建。

**解决方法**：

```bash
# 方法 1：完全重新登录（推荐）
# 断开 SSH，重新连接，然后重新运行向导的步骤 8
npm run service:uninstall
npm run wizard

# 方法 2：重启 systemd user session（不需要断开 SSH）
systemctl --user daemon-reexec
npm run service:uninstall
npm run wizard
```

## 实时日志查看

```bash
# macOS
tail -f logs/aeroloongclaw.log

# Ubuntu
sudo journalctl -u aeroloongclaw -f
```
