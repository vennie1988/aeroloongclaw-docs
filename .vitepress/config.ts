import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'AeroLoongClaw',
  description: '多模型 AI 员工平台 — 在隔离容器中运行智能体',

  base: '/aeroloongclaw/',

  head: [
    ['link', { rel: 'icon', href: '/aeroloongclaw/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/what-is', activeMatch: '/guide/' },
      { text: '使用', link: '/usage/basic', activeMatch: '/usage/' },
      { text: '部署', link: '/deploy/docker-compose', activeMatch: '/deploy/' },
      { text: '渠道', link: '/channels/', activeMatch: '/channels/' },
      { text: '运维', link: '/operations/debugging', activeMatch: '/operations/' },
      { text: '参考', link: '/reference/config', activeMatch: '/reference/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '什么是 AeroLoongClaw', link: '/guide/what-is' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装部署', link: '/guide/installation' },
            { text: '核心概念', link: '/guide/concepts' },
            { text: '触发词与消息路由', link: '/guide/triggers' },
            { text: '定时任务', link: '/guide/scheduled-tasks' },
          ],
        },
      ],
      '/usage/': [
        {
          text: '使用指南',
          items: [
            { text: '基本用法', link: '/usage/basic' },
            { text: 'HTTP API', link: '/usage/api' },
            { text: 'CLI 命令行', link: '/usage/cli' },
            { text: 'Skills 技能系统', link: '/usage/skills' },
            { text: '多模态能力', link: '/usage/multimodal' },
          ],
        },
      ],
      '/deploy/': [
        {
          text: '部署',
          items: [
            { text: 'Docker Compose', link: '/deploy/docker-compose' },
            { text: '系统服务管理', link: '/deploy/service' },
            { text: '发布包安装', link: '/deploy/release' },
            { text: '升级与回滚', link: '/deploy/upgrade' },
          ],
        },
      ],
      '/operations/': [
        {
          text: '运维',
          items: [
            { text: '故障排查', link: '/operations/debugging' },
            { text: '安全模型', link: '/operations/security' },
            { text: '部署经验', link: '/operations/lessons' },
          ],
        },
      ],
      '/channels/': [
        {
          text: '消息通道',
          items: [
            { text: '概览', link: '/channels/' },
            { text: '企业微信', link: '/channels/wecom' },
            { text: 'Web UI', link: '/channels/web-ui' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '配置参考', link: '/reference/config' },
            { text: 'MCP 工具参考', link: '/reference/mcp-tools' },
            { text: '架构详解', link: '/reference/architecture' },
            { text: '技术规格', link: '/reference/spec' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AeroLoongAI/aeroloongclaw' },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present AeroLoongAI',
    },
  },
});
