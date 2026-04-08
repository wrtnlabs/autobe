# `@autobe/estimate`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/estimate.svg)](https://www.npmjs.com/package/@autobe/estimate)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/estimate.svg)](https://www.npmjs.com/package/@autobe/estimate)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Automated quality evaluation for [AutoBE](https://github.com/wrtnlabs/autobe)-generated backend projects.

Scores generated code on a 0–100 scale (grades A–F) through static analysis, compiler validation, and optional LLM-based deep review.

## Pipeline

```
Gate Check (pass/fail)
  → Syntax · Types · Prisma · Runtime
     ↓ pass
Scoring Phases (weighted 0-100)
  → Document Quality (7%) · Requirements Coverage (18%)
  → Test Coverage (23%) · Logic Completeness (30%) · API Completeness (7%)
     ↓
Golden Set (15%, optional)
  → Contract-based API scenario tests
     ↓
Agent Evaluations (15%, optional)
  → Security (25%) · LLM Quality (40%) · Hallucination (35%)
     ↓
Final Score = Phase Score × 85% + Agent Score × 15% − Penalties (max 20pt)
```

## CLI

```bash
# Evaluate a single project
pnpm estimate -- -i <project-path> -o <output-path>

# Static analysis only (no LLM agents)
pnpm estimate -- -i <project-path> -o <output-path> --no-agent

# Include golden set evaluation
pnpm estimate -- -i <project-path> -o <output-path> --golden --project todo

# Batch evaluation across all models × projects
pnpm estimate

# Diagnose compile errors with LLM forensic analysis
pnpm estimate diagnose -- -i <project-path> -o <output-path> --api-key <key>

# Compare two model outputs side by side
pnpm estimate compare -- -p "modelA:path/a" "modelB:path/b" -o <output-path>
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input` | required | Input project path |
| `-o, --output` | required | Output directory for reports |
| `--no-agent` | agent=true | Disable LLM agent evaluation |
| `--api-key` | env | API key (or `OPENROUTER_API_KEY` env var) |
| `--golden` | false | Enable golden set evaluation |
| `--project` | — | Project type (todo, bbs, reddit, shopping, erp, gauzy) |
| `--run-tests` | false | Start Docker server and run E2E tests |
| `--auto-fix` | false | Auto-fix simple issues after evaluation |
| `--continue-on-gate-failure` | false | Score even if gate fails |
| `-v, --verbose` | false | Verbose output |

## Output

| File | Contents |
|------|----------|
| `estimate-report.json` | Scores, grade, phase details, agent findings |
| `estimate-report.md` | Markdown report with prioritized fix suggestions |
| `diagnosis.md` | Compile error diagnosis (`diagnose` command) |
