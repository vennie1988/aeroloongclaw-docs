---
title: 安装部署指南
description: 在 macOS 和 Ubuntu 24 上完整安装、部署和卸载 AeroLoongClaw 的详细流程。
---

# 安装部署指南

本文档覆盖从零开始在 **macOS** 和 **Ubuntu 24** 上安装、部署和卸载 AeroLoongClaw 的完整流程。面向新手，每一步都有详细命令和预期输出。

支持两种安装方式：
- **源码安装**（开发者路径）— 适合开发、调试、二次开发
- **Release 安装**（生产路径）— 适合客户机器部署

本文以**源码安装**为主线。

## 目录

1. [前置条件](#1-前置条件)
2. [macOS 安装部署](#2-macos-安装部署)
3. [Ubuntu 24 安装部署](#3-ubuntu-24-安装部署)
4. [安装后验证](#4-安装后验证)
5. [日常运维](#5-日常运维)
6. [卸载](#6-卸载)
7. [常见问题](#7-常见问题)

---

## 1. 前置条件

### 通用要求

| 依赖 | 最低版本 | 用途 |
|------|---------|------|
| Node.js | 20+ | 运行主进程 |
| npm | 10+ | 包管理 |
| Docker | 24+ | 运行 agent 容器 |
| Git | 2.0+ | 克隆代码 |

### 需要准备的凭据

至少需要一个 AI 模型 API Key：

| 提供商 | 环境变量 | 获取方式 |
|--------|---------|---------|
| MiniMax | `MINIMAX_API_KEY` | https://platform.minimaxi.com |
| Anthropic | `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com |
| Google | `GOOGLE_API_KEY` | https://aistudio.google.com |

---

## 2. macOS 安装部署

### 2.1 安装依赖

```bash
# 安装 Homebrew（如果没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js 和 Git
brew install node git

# 验证版本
node -v   # 应显示 v20.x 或更高
npm -v    # 应显示 10.x 或更高
```

::: tip 安装 Docker Desktop
从 https://www.docker.com/products/docker-desktop/ 下载安装。安装后启动 Docker Desktop，等待状态栏图标变为绿色（Running）。
:::

```bash
# 验证 Docker 可用
docker info | head -5
# 应显示 Server Version 等信息，不报错
```

### 2.2 克隆代码并安装

```bash
git clone https://github.com/vennie1988/aeroloongclaw.git
cd aeroloongclaw
npm install
```

::: warning 注意
macOS 下所有操作都以当前登录用户执行，**不要使用 `sudo`**。
:::

### 2.3 运行安装向导

```bash
npm run wizard
```

向导会引导你完成 9 个步骤：

#### 步骤 1：检查环境

```
=== Step 1: Check Environment ===
Platform: macOS
Container runtime: Docker Desktop
```

向导自动检测平台和容器运行时。如果 Docker Desktop 未启动，这里会报错 — 请先启动它。

#### 步骤 2：配置环境变量

```
=== Step 2: Configure Environment ===
Select AI provider: (anthropic/openai/google/minimax)
```

- 选择你的 AI 提供商（如 `minimax`）
- 输入 API Key
- 输入模型名称（直接回车接受默认值）
- 输入助手名称（默认 `Andy`，直接回车即可）

向导会将配置写入项目根目录的 `.env` 文件。

#### 步骤 3：构建容器镜像

```
=== Step 3: Build Container Image ===
Building container image...
```

首次构建需要 2-5 分钟（下载基础镜像和依赖）。后续重建会快得多。

#### 步骤 4-7：渠道和群组配置

按照提示选择启用的渠道（Web UI 默认启用）、输入渠道凭据、注册群组。

#### 步骤 8：安装服务

```
=== Step 8: Setup Service ===
Generating and loading service...
✓ Service started successfully!
```

向导会：
1. 编译 TypeScript（`npm run build`）
2. 生成 `~/Library/LaunchAgents/com.aeroloongclaw.plist`
3. 执行 `launchctl load` 加载服务
4. 等待服务启动并验证稳定性（2 秒存活检测）

如果看到 `✗ Service failed to start`，检查日志：

```bash
cat logs/aeroloongclaw.error.log
```

#### 步骤 9：验证安装

向导自动检查服务状态、容器运行时、API Key 等。

### 2.4 macOS 服务管理

安装后，AeroLoongClaw 作为 launchd 服务运行。配置了 `KeepAlive` 和 `RunAtLoad`，开机自动启动，崩溃自动重启。

```bash
# 查看服务状态
launchctl list | grep aeroloongclaw
# 输出格式：PID  ExitStatus  Label
# 例如：12345  0  com.aeroloongclaw    ← 正常运行
#        -     78 com.aeroloongclaw    ← 崩溃循环（无 PID + 非零退出码）

# 重启服务
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw

# 查看日志
tail -f logs/aeroloongclaw.log           # JSON 格式主日志
tail -f logs/aeroloongclaw.error.log     # 人类可读格式
```

**服务文件位置**：

| 文件 | 路径 |
|------|------|
| launchd plist | `~/Library/LaunchAgents/com.aeroloongclaw.plist` |
| 主日志（JSON） | `logs/aeroloongclaw.log` |
| 错误日志（可读） | `logs/aeroloongclaw.error.log` |
| 环境配置 | `.env` |

---

## 3. Ubuntu 24 安装部署

Ubuntu 24 有两种运行模式：
- **普通用户安装**（推荐）— 使用 `systemctl --user`，无需 root
- **root 安装**（生产环境）— 创建专用 `aeroloongclaw` 系统用户

### 3.1 安装依赖

```bash
# 更新包索引
sudo apt update

# 安装 Node.js 20+（Ubuntu 24 默认仓库可能版本较低，使用 NodeSource）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装其他依赖
sudo apt install -y git docker.io

# 验证版本
node -v   # v20.x+
npm -v    # 10.x+
docker --version
```

**配置 Docker 权限**（让当前用户无需 sudo 即可使用 Docker）：

```bash
# 将当前用户加入 docker 组
sudo usermod -aG docker $USER

# 【重要】必须重新登录才能生效！
# 如果是 SSH 连接，断开并重新连接：
exit
# 然后重新 SSH 登录

# 验证 Docker 可用（不用 sudo）
docker info | head -5
```

::: warning 为什么必须重新登录？
`usermod -aG docker` 修改的是系统组数据库，但当前会话的组列表在登录时就固定了。
不重新登录的话，`docker` 命令仍然报 `permission denied`。
如果你安装了 systemd 用户服务，systemd 的 user session 也需要刷新 —
向导会自动检测这种情况并警告。
:::

### 3.2 克隆代码并安装

```bash
git clone https://github.com/vennie1988/aeroloongclaw.git
cd aeroloongclaw
npm install
```

### 3.3 运行安装向导

<tabs>
<tab label="普通用户安装（推荐）">

```bash
npm run wizard
```

向导步骤与 macOS 相同（见 2.3 节），差异仅在步骤 8：

**步骤 8 的 Linux 行为**：
1. 编译 TypeScript
2. 检测 systemd 用户会话是否可用
3. 执行 `loginctl enable-linger`（让服务在 SSH 断开后继续运行）
4. 生成 `~/.config/systemd/user/aeroloongclaw.service`
5. 执行 `systemctl --user daemon-reload && enable && start`
6. 轮询等待服务变为 active

::: tip 关于 linger
Ubuntu 24 默认在用户最后一个会话结束时杀死所有用户服务。
`loginctl enable-linger` 让你的 user-level 服务在 SSH 断开后继续运行。
向导会自动执行这一步。如果失败（例如被管理员禁用），你会看到警告：
`loginctl enable-linger failed — service may stop when you disconnect SSH`
:::

```bash
# 验证 linger 状态
loginctl show-user $USER | grep Linger
# 应显示 Linger=yes
```

</tab>
<tab label="root 安装（生产环境）">

当你需要以 root 身份安装系统级服务时：

```bash
sudo npm run wizard
```

root 安装的行为差异：
- 自动创建 `aeroloongclaw` 系统用户（uid 通常自动分配）
- 将该用户加入 `docker` 组
- systemd unit 写入 `/etc/systemd/system/aeroloongclaw.service`
- 服务以 `User=aeroloongclaw` 运行（**不以 root 运行**）
- 数据目录 chown 给 `aeroloongclaw` 用户

::: warning 为什么不以 root 运行服务？
AeroLoongClaw 创建的目录需要被容器内的 `node` 用户（uid 1000）访问。
如果主进程以 root 运行，创建的目录 owner 是 root (uid 0)，容器内会报 EACCES。
使用专用用户避免了这个问题。
:::

</tab>
</tabs>

### 3.4 Ubuntu 服务管理

<tabs>
<tab label="普通用户安装">

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

</tab>
<tab label="root 安装">

```bash
# 查看服务状态
sudo systemctl status aeroloongclaw

# 重启服务
sudo systemctl restart aeroloongclaw

# 查看实时日志
sudo journalctl -u aeroloongclaw -f
```

</tab>
</tabs>

**服务文件位置**：

| 项目 | 普通用户安装 | root 安装 |
|------|-------------|----------|
| systemd unit | `~/.config/systemd/user/aeroloongclaw.service` | `/etc/systemd/system/aeroloongclaw.service` |
| 主日志 | `logs/aeroloongclaw.log` | `logs/aeroloongclaw.log` |
| 错误日志 | `logs/aeroloongclaw.error.log` | `logs/aeroloongclaw.error.log` |
| 环境配置 | `.env` | `.env` |

### 3.5 Docker 组生效问题

如果向导报告 `Docker group not active in systemd session`：

```
Docker group not active in systemd session — user was likely added to docker group mid-session
```

**这意味着**：你在当前会话中被加入了 docker 组，终端里 `docker` 命令可以正常使用，但 systemd 的 user session 还不知道这个变更。服务启动后容器可能无法创建。

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

---

## 4. 安装后验证

### 4.1 系统健康检查

```bash
npm run doctor
```

预期输出示例：

```
✓ Environment: .env loaded, OPENCODE_MODEL set
✓ Container Runtime: Docker available
✓ SQLite: database accessible
✓ Directories: all required directories exist
✓ Service: running
```

### 4.2 发送测试消息

如果启用了 Web UI（默认启用），可以通过 API 测试：

```bash
# 查看 Web UI Token（在启动日志中）
grep "Web UI" logs/aeroloongclaw.log | tail -1

# 发送测试消息
curl -X POST http://127.0.0.1:3100/api/web/messages \
  -H "Authorization: Bearer <你的WEB_UI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "sessionId": "test-session"}'
```

### 4.3 查看容器活动

```bash
# 查看正在运行的 agent 容器
docker ps | grep aeroloongclaw-agent

# 查看最近的容器运行日志
ls -lt groups/*/logs/container-*.log | head -5
```

---

## 5. 日常运维

### 5.1 查看运行状态

```bash
npm run status          # 运行时状态快照 + 最近运行指标
npm run doctor          # 系统健康检查
```

### 5.2 更新代码

```bash
# 拉取最新代码
git pull

# 重新安装依赖（如果 package.json 有变化）
npm install

# 重新构建
npm run build

# 重建容器镜像（如果 container/ 有变化）
./container/build.sh

# 重启服务
```

<tabs>
<tab label="macOS">

```bash
launchctl kickstart -k gui/$(id -u)/com.aeroloongclaw
```

</tab>
<tab label="Ubuntu（普通用户）">

```bash
systemctl --user restart aeroloongclaw
```

</tab>
<tab label="Ubuntu（root 安装）">

```bash
sudo systemctl restart aeroloongclaw
```

</tab>
</tabs>

### 5.3 修改配置

编辑 `.env` 文件后需要重启服务才能生效：

```bash
# 编辑配置
nano .env

# 重启服务（选择你的平台，见上方 5.2 节）
```

### 5.4 日志管理

日志文件在 `logs/` 目录下，启动时自动轮转，保留 3 天。

```bash
# 实时查看主日志
tail -f logs/aeroloongclaw.log

# 查看错误日志（人类可读格式）
tail -f logs/aeroloongclaw.error.log

# 查看某个群组的容器运行日志
tail -f groups/<group-name>/logs/container-*.log
```

---

## 6. 卸载

### 6.1 macOS 卸载

#### 使用内置命令（推荐）

```bash
cd aeroloongclaw

# 停止并移除服务（不删除代码和数据）
npm run service:uninstall
```

#### 完全卸载

```bash
# 1. 停止并移除 launchd 服务
launchctl unload ~/Library/LaunchAgents/com.aeroloongclaw.plist 2>/dev/null
rm -f ~/Library/LaunchAgents/com.aeroloongclaw.plist

# 2. 移除 Docker 镜像（可选，释放磁盘空间）
docker images | grep aeroloongclaw-agent | awk '{print $1":"$2}' | xargs docker rmi 2>/dev/null

# 3. 删除项目目录
cd ~
rm -rf aeroloongclaw    # 或你克隆代码的目录
```

### 6.2 Ubuntu 卸载

#### 使用内置命令（推荐）

```bash
cd aeroloongclaw

# 停止并移除服务（不删除代码和数据）
npm run service:uninstall
```

#### 完全卸载（普通用户安装）

```bash
# 1. 停止并移除 systemd user 服务
systemctl --user stop aeroloongclaw 2>/dev/null
systemctl --user disable aeroloongclaw 2>/dev/null
rm -f ~/.config/systemd/user/aeroloongclaw.service
systemctl --user daemon-reload

# 2. 移除 Docker 镜像（可选）
docker images | grep aeroloongclaw-agent | awk '{print $1":"$2}' | xargs docker rmi 2>/dev/null

# 3. 删除项目目录
cd ~
rm -rf aeroloongclaw
```

#### 完全卸载（root 安装）

```bash
# 1. 停止并移除 systemd 系统服务
sudo systemctl stop aeroloongclaw
sudo systemctl disable aeroloongclaw
sudo rm -f /etc/systemd/system/aeroloongclaw.service
sudo systemctl daemon-reload

# 2. 移除 Docker 镜像（可选）
docker images | grep aeroloongclaw-agent | awk '{print $1":"$2}' | xargs docker rmi 2>/dev/null

# 3. 删除项目目录
cd ~
sudo rm -rf aeroloongclaw

# 4. 删除专用服务用户（可选）
sudo userdel aeroloongclaw
sudo groupdel aeroloongclaw 2>/dev/null
```

---

## 7. 常见问题

### Q: Docker Desktop 未运行（macOS）

```
Error: Cannot connect to the Docker daemon
```

**解决**：启动 Docker Desktop 应用，等待状态栏图标变为绿色，然后重试。

### Q: permission denied（Ubuntu，安装 Docker 后）

```
Got permission denied while trying to connect to the Docker daemon socket
```

**解决**：

```bash
# 确认已加入 docker 组
groups | grep docker

# 如果没有，添加并重新登录
sudo usermod -aG docker $USER
exit
# 重新 SSH 登录后重试
```

### Q: 容器 EACCES 权限错误

```
EACCES: permission denied, mkdir '/home/node/.cache/opencode'
```

**可能原因**：
- macOS: Docker Desktop 版本过旧，建议升级到最新版
- Ubuntu root 安装: 主进程意外以 root 运行而非 `aeroloongclaw` 用户

**解决（Ubuntu root 安装）**：

```bash
# 检查服务以哪个用户运行
sudo systemctl show aeroloongclaw | grep User=
# 应显示 User=aeroloongclaw，而非 User=root

# 如果目录权限已经混乱，修复：
sudo chown -R aeroloongclaw:aeroloongclaw groups/ data/
sudo systemctl restart aeroloongclaw
```

### Q: 服务崩溃循环（crash-looping）

```
✗ Service is crash-looping — check logs/aeroloongclaw.error.log
```

**解决**：

```bash
# 查看错误日志
cat logs/aeroloongclaw.error.log

# 常见原因：
# 1. API Key 无效 → 检查 .env 中的 key
# 2. Docker 不可用 → 检查 docker info
# 3. 端口被占用 → 检查 WEB_UI_PORT / API_PORT
```

### Q: SSH 断开后服务停止（Ubuntu 普通用户安装）

**原因**：`loginctl enable-linger` 未生效。

```bash
# 检查 linger 状态
loginctl show-user $USER | grep Linger

# 如果 Linger=no，手动启用
loginctl enable-linger

# 如果报权限错误，需要管理员执行
sudo loginctl enable-linger $USER
```

### Q: 容器构建失败

```bash
# 清理 Docker 构建缓存后重试
docker builder prune -f
./container/build.sh
```

### Q: 如何切换 AI 模型

编辑 `.env` 文件中的 `OPENCODE_MODEL` 和对应的 API Key：

```bash
# 切换到 Anthropic Claude
OPENCODE_MODEL=anthropic/claude-sonnet-4-20250514
ANTHROPIC_API_KEY=sk-ant-xxx

# 切换到 MiniMax
OPENCODE_MODEL=minimax/MiniMax-M2.7
MINIMAX_API_KEY=sk-xxx

# 切换到 OpenAI
OPENCODE_MODEL=openai/gpt-4o
OPENAI_API_KEY=sk-xxx
```

修改后重启服务生效。
