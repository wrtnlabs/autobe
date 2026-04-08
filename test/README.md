# `@autobe/test`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Integration test and benchmark archive suite for [AutoBE](https://github.com/wrtnlabs/autobe).

130 test scenarios covering compiler validation, agent orchestration, and full pipeline generation across multiple LLM vendors. Results are archived as git commits for historical comparison.

## Scripts

```bash
# Run tests
pnpm start

# Run with prompt rebuild
pnpm run archive:go

# Archive test results to git commits
pnpm run archive:commit

# Log failures
pnpm run archive:failures > failures.log

# Debug output
pnpm run archive:debug > debug.log.md

# Local testing
pnpm run archive:local

# Publish results
pnpm run archive:publish

# Test instruction system
pnpm run test:instruction
```

## CLI Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--vendor` | `qwen/qwen3-coder-next` | LLM vendor/model via OpenRouter |
| `--include` | — | Filter: only run matching test names |
| `--exclude` | — | Filter: skip matching test names |
| `--useToolChoice` | — | Enable tool choice mode |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | LLM API key (required) |
| `BENCHMARK_RUNS_PER_SCENARIO` | Number of iterations per test |
| `TIMEOUT` | Test timeout |
| `SEMAPHORE` | Max concurrent LLM calls (default: 32) |

## Test Categories

| Category | Description |
|----------|-------------|
| `benchmark/` | Multi-vendor comparison |
| `compiler/` | Prisma, OpenAPI, TypeScript validation |
| `programmer/` | Interface endpoint and schema programming |
| `schema/` | Database schema handling |
| `describe/` | Requirements analysis |
| `playground/` | Playground feature tests |
| `validate/` | Validation tests |
| `typings/` | Type system tests |
| `utils/` | Utility tests |

## Example Projects

Test scripts in `scripts/` define example requirements:

| Script | Description |
|--------|-------------|
| `todo.md` | Task management |
| `bbs.md` | Discussion board |
| `reddit.md` | Community forum |
| `shopping.md` | E-commerce platform |
| `erp.md` | Enterprise resource planning |
| `chat.md` | Chat application |
| `time-tracking.md` | Time tracking |
