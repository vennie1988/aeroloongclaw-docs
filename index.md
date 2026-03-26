---
layout: home

hero:
  name: AeroLoongClaw
  text: 多模型 AI 员工平台
  tagline: 在隔离 Linux 容器中运行智能体，支持多种 LLM、消息通道和技能扩展
  image:
    src: /logo.svg
    alt: AeroLoongClaw
  actions:
    - theme: brand
      text: 快速开始
      link: /aeroloongclaw-docs/guide/getting-started
    - theme: alt
      text: 安装部署
      link: /aeroloongclaw-docs/guide/installation
    - theme: alt
      text: GitHub
      link: https://github.com/AeroLoongAI/aeroloongclaw

features:
  - icon: 🏠
    title: 容器隔离
    details: 每个任务在独立 Docker 容器中运行，文件系统、网络、进程完全隔离，安全可控
  - icon: 🤖
    title: 多模型支持
    details: 开箱即用支持 Anthropic、OpenAI、Google、MiniMax 等主流 LLM 提供商
  - icon: 💬
    title: 消息通道
    details: 企业微信、Web UI 等多种接入方式，消息驱动的智能体交互
  - icon: 🧩
    title: 技能扩展
    details: 77+ 运行时技能，支持浏览器自动化、文档处理、代码生成等能力
  - icon: 📡
    title: HTTP API & CLI
    details: 完整的 REST/SSE API 和命令行工具，支持编程式调用和远程执行
  - icon: 🏢
    title: 团队协作
    details: 按群组隔离上下文和存储，支持多人多任务并行处理
---

<div class="vp-doc container">

## 快速开始

### 第一步：克隆并安装

```bash
git clone https://github.com/AeroLoongAI/aeroloongclaw.git
cd aeroloongclaw
npm install && npm run wizard
```

### 第二步：配置并启动

向导引导完成 API Key 配置、容器镜像构建和群组创建。

### 第三步：开始使用

通过 Web UI（默认 `http://127.0.0.1:3100`）或 HTTP API 发送消息。

## 工作原理

AeroLoongClaw 通过消息驱动架构将聊天渠道（企业微信、Web UI）与 AI 智能体连接。

**三层架构：**

- **渠道层** — 接收消息，写入 SQLite，由轮询循环分发到对应群组队列
- **执行引擎** — 群组队列串行消费，容器隔离运行 agent-runner，支持多种 LLM
- **IPC 层** — 容器内通过文件系统写入 JSON 文件，主进程路由到渠道层

## 从这里开始

<div class="cards">
  <a href="/aeroloongclaw-docs/guide/what-is" class="card">
    <h3>什么是 AeroLoongClaw</h3>
    <p>平台概述、核心概念和架构原理</p>
  </a>
  <a href="/aeroloongclaw-docs/guide/getting-started" class="card">
    <h3>快速开始</h3>
    <p>5 分钟内启动你的第一个 AI 员工</p>
  </a>
  <a href="/aeroloongclaw-docs/guide/installation" class="card">
    <h3>安装部署</h3>
    <p>macOS、Ubuntu 的完整安装流程和服务管理</p>
  </a>
  <a href="/aeroloongclaw-docs/usage/basic" class="card">
    <h3>基础用法</h3>
    <p>API 调用、CLI 命令和 SDK 集成</p>
  </a>
  <a href="/aeroloongclaw-docs/channels/" class="card">
    <h3>消息渠道</h3>
    <p>企业微信、Web UI 等渠道的具体配置</p>
  </a>
  <a href="/aeroloongclaw-docs/reference/config" class="card">
    <h3>配置参考</h3>
    <p>所有环境变量和配置项的完整说明</p>
  </a>
</div>

## 了解更多

<div class="cards">
  <a href="/aeroloongclaw-docs/guide/concepts" class="card">
    <h3>核心概念</h3>
    <p>群组隔离、容器生命周期、IPC 机制</p>
  </a>
  <a href="/aeroloongclaw-docs/deploy/docker-compose" class="card">
    <h3>Docker Compose 部署</h3>
    <p>生产环境的容器化部署方案</p>
  </a>
  <a href="/aeroloongclaw-docs/usage/skills" class="card">
    <h3>技能系统</h3>
    <p>77+ 运行时技能的安装与使用</p>
  </a>
  <a href="/aeroloongclaw-docs/operations/debugging" class="card">
    <h3>故障排查</h3>
    <p>常见问题诊断和调试方法</p>
  </a>
</div>

</div>

<style scoped>
.vp-doc.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
.vp-doc h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 1.5rem;
}
.vp-doc h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
.vp-doc p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.card {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.2s, background-color 0.2s;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
}
</style>
