# `@autobe/website`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Documentation website for [AutoBE](https://github.com/wrtnlabs/autobe), hosted at [autobe.dev](https://autobe.dev).

Built with Next.js + Nextra. Includes guide documents, API reference (TypeDoc), blog with RSS, full-text search (Pagefind), and an embedded dashboard demo.

## Scripts

```bash
# Full build (dashboard + TypeDoc + Next.js + Pagefind + sitemap)
pnpm run build

# Local development
pnpm run dev

# Deploy to production
pnpm run deploy

# Individual build steps
pnpm run build:dashboard    # Build and copy dashboard UI
pnpm run build:typedoc      # Generate API reference
pnpm run build:blog:rss     # Generate RSS feed
pnpm run build:pagefind     # Build search index
pnpm run build:sitemap      # Generate sitemap

# Capture screenshots
pnpm run screenshot
```

## Content Structure

| Section | Path | Description |
|---------|------|-------------|
| Introduction | `docs/index.mdx` | Overview with demo video |
| Setup | `docs/setup.mdx` | Installation and getting started |
| Concepts | `docs/concepts/` | Waterfall, compiler, function calling |
| Agent Library | `docs/agent/` | Facade, config, events, history |
| WebSocket Protocol | `docs/websocket/` | Real-time communication |
| Backend Stack | `docs/stack/` | TypeScript, NestJS, Prisma |
| Roadmap | `docs/roadmap/` | Alpha → Epsilon version plans |
| Blog | `blog/` | Articles with tags and Giscus comments |
| API Documents | auto-generated | TypeDoc from `@autobe/interface` |
| Dashboard | embedded | Copied from `apps/dashboard-ui` |
