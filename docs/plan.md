# Plan: 部署 Docs Site 到 GitHub Pages

## 目标

将 `docs-site` VitePress 文档站部署到 GitHub Pages，使可通过 `https://vennie1988.github.io/aeroloongclaw-docs/` 访问。

**仓库**: `https://github.com/vennie1988/aeroloongclaw-docs.git`（独立于主项目）

## 当前状态

| 项目 | 状态 |
|------|------|
| 独立仓库 `aeroloongclaw-docs` | ✓ 已确认 |
| VitePress `base: '/aeroloongclaw/'` | ✓ 已配置 |
| `public/logo.svg` | ✓ 已存在 |
| `dist/404.html` (SPA fallback) | ✓ 已构建 |
| GitHub Actions workflow | ✗ 缺失 |
| GitHub Pages source branch | ✗ 未配置 |

## Phase 1: GitHub Actions 部署工作流

### 目标
创建 GitHub Actions workflow，实现 push 到 main 分支时自动构建并部署到 GitHub Pages。

### 文件变更
- [新建] `.github/workflows/deploy.yml`

### 关键实现

```yaml
# .github/workflows/deploy.yml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:   # 手动触发

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build VitePress site
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 完成标准
- [ ] `.github/workflows/deploy.yml` 创建完成
- [ ] GitHub Pages 已启用（Settings → Pages → Source: GitHub Actions）
- [ ] 手动触发 `workflow_dispatch` 验证构建成功
- [ ] 访问 `https://vennie1988.github.io/aeroloongclaw/` 验证

## Phase 2: 添加手动部署脚本（可选）

### 目标
提供本地 `npm run deploy` 命令，通过 GitHub CLI 直接推送到 `gh-pages` 分支（作为 GitHub Actions 的替代方案）。

### 文件变更
- [修改] `package.json` — 添加 `deploy` 脚本

### 关键实现

```json
{
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview",
    "deploy": "npm run build && ghpages -t"
  }
}
```

或使用 `gh-pages` npm 包：

```bash
npm install --save-dev gh-pages
```

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d .vitepress/dist"
  }
}
```

### 完成标准
- [ ] `npm run deploy` 可正常执行
- [ ] 文档站正确部署到 GitHub Pages

## 验证步骤（完成后执行）

1. **触发工作流**: 在 GitHub Actions 页面手动运行 workflow
2. **检查部署**: 访问 `https://vennie1988.github.io/aeroloongclaw/`
3. **验证导航**: 点击导航链接，确认路由正常
4. **验证搜索**: 本地搜索功能正常

## 注意事项

- GitHub Pages 默认从 `gh-pages` 分支部署，Actions 会自动推送构建产物
- `base: '/aeroloongclaw/'` 已配置，假设仓库名为 `aeroloongclaw`
- 如需自定义域名，可在 `public/` 添加 `CNAME` 文件
