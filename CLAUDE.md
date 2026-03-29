# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitePress documentation site for AeroLoongClaw (AeroLoongAI/aeroloongclaw), deployed at `https://vennie1988.github.io/aeroloongclaw-docs/`. Docs are in Chinese (zh-CN) covering installation, usage, deployment, channels, operations, and reference.

Source of truth for the main project: `../` (the AeroLoongClaw monorepo).

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server with hot reload (default: localhost:3000/aeroloongclaw-docs/)
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
- **Base path**: `base: '/aeroloongclaw-docs/'` — VitePress auto-prefixes all internal links. Links in markdown should NOT include the base prefix (e.g., use `/guide/what-is`, not `/aeroloongclaw-docs/guide/what-is`)
- **Homepage**: `index.md` uses `layout: home` with hero + features + custom markdown sections
- **Theme**: `.vitepress/theme/index.ts` — extends DefaultTheme; `.vitepress/theme/style.css` — custom overrides
- **Public assets**: `public/` — static files served at site root

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to `gh-pages` branch via `peaceiris/actions-gh-pages@v4`. GitHub Pages serves from that branch.

## Build Output

Built site is `.vitepress/dist/`. The `base: '/aeroloongclaw-docs/'` in config.ts ensures all assets and links are prefixed correctly.
