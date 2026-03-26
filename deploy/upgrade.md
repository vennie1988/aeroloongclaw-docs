---
title: 升级与回滚
description: AeroLoongClaw 升级方法和回滚操作
---

# 升级与回滚

本文档介绍 AeroLoongClaw 的升级方法和回滚操作。

## 检查当前版本

在升级前，建议先确认当前版本。

::: code-group

```bash [package.json]
# 查看 package.json 中的版本号
cat package.json | grep '"version"'
```

```bash [Docker 镜像]
# 查看当前运行的 Docker 镜像标签
docker images | grep aeroloongclaw-agent
```

:::

## 源码升级

适用于通过 `git clone` 方式部署的用户。

### 1. 拉取最新代码

```bash
git pull origin main
```

### 2. 安装依赖

```bash
npm install
```

### 3. 编译 TypeScript

```bash
npm run build
```

### 4. 重建容器镜像

源码升级后，需要重新构建 agent 容器镜像：

```bash
./container/build.sh
```

::: tip 提示
如果 `CONTAINER_IMAGE` 环境变量指向的不是 `aeroloongclaw-agent:latest`，请确保在 `.env` 中指定正确的镜像名称。
:::

## Docker Compose 升级

适用于通过 Docker Compose 部署的用户。

### 1. 拉取最新镜像

```bash
docker compose pull
```

### 2. 重启服务

```bash
docker compose up -d
```

::: tip 提示
如果代码有更新（非仅镜像更新），需要重新构建：

```bash
docker compose up -d --build
```
:::

## 查看更新日志

当前项目未提供独立的 CHANGELOG 文件。更新内容可在以下位置查看：

- [GitHub Releases 页面](https://github.com/AeroLoongAI/aeroloongclaw/releases)
- Git 提交历史：`git log --oneline -20`

## 回滚操作

如果升级后遇到问题，可以按以下步骤回滚。

### 源码回滚

::: warning 注意
回滚前请确保已停止运行中的服务。
:::

### 1. 查看可用标签

```bash
git tag -l
```

### 2. 切换到指定版本

```bash
git checkout <previous-tag>
```

### 3. 重新安装依赖并构建

```bash
npm install
npm run build
./container/build.sh
```

### Docker Compose 回滚

#### 方式一：使用指定版本标签

```bash
# 停止当前服务
docker compose down

# 拉取指定版本镜像（如果版本标签存在）
docker pull aeroloongclaw-agent:<version>

# 使用环境变量指定旧版本镜像
CONTAINER_IMAGE=aeroloongclaw-agent:<version> docker compose up -d
```

#### 方式二：修改镜像标签

编辑 `.env` 文件，指定要回滚的镜像版本：

```bash
CONTAINER_IMAGE=aeroloongclaw-agent:<previous-version>
```

然后重启服务：

```bash
docker compose down
docker compose up -d
```

::: warning 注意
回滚后，之前版本创建的数据和配置可能与当前代码不兼容。如果问题持续，建议查看 [故障排查](/operations/debugging) 文档。
:::

## 验证升级成功

升级完成后，可以通过以下方式验证：

```bash
# 验证服务状态
npm run status

# 验证健康检查
curl http://localhost:3200/v1/health

# 验证 CLI 可用
aeroloongclaw --version
```
