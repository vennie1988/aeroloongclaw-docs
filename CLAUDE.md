# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the VitePress documentation site for AeroLoongClaw, deployed at `/aeroloongclaw/`. The docs are in Chinese (zh-CN) and cover the full platform: installation, usage, deployment, channels, operations, and reference.

Source of truth for the main project: `../` (the AeroLoongClaw monorepo).

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server with hot reload (default: localhost:3000/aeroloongclaw/)
npm run build      # Build static site to .vitepress/dist
npm run preview    # Preview the built site
```

## Documentation Structure

Content lives in top-level directories matching the nav sections:

| Directory | Section | Description |
|-----------|---------|-------------|
| `guide/` | 指南 | Getting started, installation, concepts, triggers, scheduled tasks |
| `usage/` | 使用 | Basic usage, HTTP API, CLI, skills, multimodal capabilities |
| `deploy/` | 部署 | Docker Compose, service management, releases, upgrades |
| `channels/` | 渠道 | WeCom, Web UI integration |
| `operations/` | 运维 | Debugging, security, deployment lessons |
| `reference/` | 参考 | Config reference, MCP tools, architecture, spec |

Config: `.vitepress/config.ts` — defines nav, sidebar, SEO meta, and theme.

## VitePress Conventions

- **Frontmatter**: All pages should have `---` frontmatter with title/description
- **Base path**: All internal links use `/aeroloongclaw/` prefix (e.g., `/aeroloongclaw/guide/getting-started`)
- **Homepage**: `index.md` uses `layout: home` hero configuration
- **Theme**: `.vitepress/theme/` — custom theme overrides
- **Public assets**: `public/` — static files served at `/aeroloongclaw/` root

## Build Output

Built site deploys from `.vitepress/dist/`. The `base: '/aeroloongclaw/'` in config.ts ensures all assets and links are prefixed correctly.
