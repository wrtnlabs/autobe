# `@autobe/hackathon-server`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Hackathon backend server for [AutoBE](https://github.com/wrtnlabs/autobe).

NestJS + Prisma + PostgreSQL server that hosts multi-user hackathon sessions with WebSocket RPC communication.

## Prerequisites

- PostgreSQL running on `127.0.0.1:5432`
- Database `autobe` with schema `wrtnlabs` created
- User `autobe:autobe` with appropriate permissions
- `pg_trgm` extension enabled

## Setup

```bash
# 1. Configure environment variables
cp .env.local .env
# Edit .env — set API keys, DB credentials, JWT secrets

# 2. Build (generates Prisma client + compiles TypeScript)
pnpm run build

# 3. Start server (default port: 5888)
pnpm run start
```

## Scripts

```bash
pnpm run start          # Start server
pnpm run build          # Build (env + Prisma generate + tsc)
pnpm run build:sdk      # Generate client SDK via Nestia
pnpm run schema         # Run schema management
pnpm run test           # Run tests
pnpm run dev            # TypeScript watch mode
pnpm run pm2:start      # Start with PM2 process manager
```
