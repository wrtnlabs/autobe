# `@autobe/test`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Integration test and benchmark archive suite for [AutoBE](https://github.com/wrtnlabs/autobe).

130 test scenarios covering compiler validation, agent orchestration, and full pipeline generation across multiple LLM vendors. Results are archived as git commits for historical comparison.

## Setup

```bash
# Configure environment
cp .env.example .env
# Edit .env — set OPENROUTER_API_KEY

# Run tests
pnpm start

# Run with prompt rebuild
pnpm run archive:go
```

## Scripts

```bash
pnpm start                    # Run tests
pnpm run archive:go           # Rebuild prompts + run tests
pnpm run archive:commit       # Archive results to git commits
pnpm run archive:failures     # Log failures
pnpm run archive:debug        # Debug output → debug.log.md
pnpm run archive:local        # Local testing
pnpm run archive:publish      # Publish results
pnpm run test:instruction     # Test instruction system
```

## CLI Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--vendor` | `qwen/qwen3-coder-next` | LLM vendor/model via OpenRouter |
| `--include` | — | Filter: only run matching test names |
| `--exclude` | — | Filter: skip matching test names |
| `--useToolChoice` | — | Enable tool choice mode |

## Diagnosis

`DIAGNOSE.md` is a system prompt for Claude Code that performs 7-phase forensic analysis on remaining compile errors after self-healing loops are exhausted. Feed it with `debug.log.md` and it will:

1. Enumerate every failed (model, project) pair from `debug.log.md`
2. Perform 7-step analysis per error file (error message → Prisma schema → DTO spec → faulty code → root cause → corrected code → recommendation)
3. Cluster error patterns across models and projects
4. Deep-dive into AutoBE source (prompts, orchestrators, compilers) to trace root causes
5. Self-critique all conclusions and output concrete fix proposals

Results are written to `test/diagnoses/` — per-model detail reports in `providers/{model}.md` and a unified proposal in `README.md`.
