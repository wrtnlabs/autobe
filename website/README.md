# `@autobe/website`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Documentation website for [AutoBE](https://github.com/wrtnlabs/autobe), hosted at [autobe.dev](https://autobe.dev).

Built with Next.js + Nextra. Includes guide documents, API reference (TypeDoc), blog with RSS, full-text search (Pagefind), and an embedded dashboard demo from `apps/dashboard-ui`.

## Scripts

```bash
pnpm run dev                # Local development
pnpm run build              # Full build (dashboard + TypeDoc + Next.js + Pagefind + sitemap)
pnpm run deploy             # Deploy to production

# Individual build steps
pnpm run build:dashboard    # Build and copy dashboard UI
pnpm run build:typedoc      # Generate API reference
pnpm run build:blog:rss     # Generate RSS feed
pnpm run build:pagefind     # Build search index
pnpm run build:sitemap      # Generate sitemap
pnpm run screenshot         # Capture screenshots with Puppeteer
```
