# `@autobe/playground-server`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Playground backend server for [AutoBE](https://github.com/wrtnlabs/autobe).

NestJS + Prisma + SQLite server for single-user playground sessions with WebSocket RPC communication. No external database required — SQLite file is auto-created on first run.

## Setup

```bash
# 1. Configure environment variables
cp .env.local .env
# Edit .env — set encryption keys

# 2. Build (generates Prisma client + compiles TypeScript)
pnpm run build

# 3. Start server (auto-migrates DB, default port: 5889)
pnpm run start
```

## Scripts

```bash
pnpm run start          # Migrate DB + start server
pnpm run build          # Build (env + Prisma generate + tsc)
pnpm run build:sdk      # Generate client SDK via Nestia
pnpm run test           # Run tests
pnpm run dev            # TypeScript watch mode
```
