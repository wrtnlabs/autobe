# @autobe/estimate

A CLI tool that evaluates code quality for AutoBE-generated projects.

## Quick Start

```bash
# 1. Build (only needed once)
cd packages/estimate
corepack pnpm build

# 2. Set up environment
cp .env.example .env
# Fill in OPENROUTER_API_KEY if you want AI agent evaluation

# 3. Run a single evaluation
node dist/bin/estimate.js -i /path/to/project -o ./reports --project todo

# 4. Run the full benchmark suite
./run-benchmark.sh
```

## CLI Usage

```bash
node dist/bin/estimate.js -i <path> -o <path> [options]
```

| Option | Description |
|--------|-------------|
| `-i, --input <path>` | Path to the project to evaluate (required) |
| `-o, --output <path>` | Directory to save reports (required) |
| `-v, --verbose` | Show detailed logs |
| `--continue-on-gate-failure` | Continue evaluation even if gate fails |
| `--use-agent` | Enable AI agent evaluation (25% of score) |
| `--provider <provider>` | LLM provider: `claude`, `openai`, `openrouter` |
| `--api-key <key>` | API key (or set `OPENROUTER_API_KEY` env var) |
| `--auto-fix` | Auto-fix simple issues (TS1161, TS7006) |
| `--run-tests` | Start Docker server and run e2e tests |
| `--golden` | Run Golden Set evaluation |
| `--project <project>` | Project type: `todo`, `bbs`, `reddit`, `shopping` |

## Scoring System

### Gate Check (pass/fail)

If the code doesn't compile, you get a 0.

- **Source file check**: No TypeScript files in `src/` means instant failure (GATE001)
- **TypeScript compilation**: Uses `AutoBeTypeScriptCompiler` (in-memory)
- **Prisma schema validation**: Uses `AutoBeDatabaseCompiler` (in-memory)

### Scoring Phases (75% of total without agents, 100% without)

| Phase | Weight | What we check |
|-------|--------|---------------|
| Document Quality | 5% | Presence of `docs/analysis/`, README |
| Requirements Coverage | 25% | Controllers, providers, DTOs coverage |
| Test Coverage | 25% | Route-level test coverage, assertion quality, stub detection |
| Logic Completeness | 35% | TODOs, FIXMEs, empty methods, stub returns |
| API Completeness | 10% | Endpoint implementation, provider delegation |

### Penalties

| Penalty | Trigger | Max Deduction |
|---------|---------|---------------|
| Warning | Warning ratio > 50% | -10 |
| Duplication | > 50 duplicate blocks | -5 |
| JSDoc | > 10% missing | -5 |
| Schema Sync (SYNC001) | > 5 empty types in DTOs | -5 |
| Schema Sync (SYNC002) | >= 3 Prisma-Structure mismatches | -5 |
| Mapping ratio (REQ006) | < 50% controller-provider coverage | -40 |

### Reference Info (no score impact)

- **Complexity**: Functions with cyclomatic complexity > 15
- **Duplication**: Blocks of 10+ identical lines
- **Naming**: PascalCase violations
- **JSDoc**: Missing documentation comments
- **Schema Sync**: Empty interfaces (SYNC001) + Prisma-Structure property mismatches (SYNC002)

### AI Agent Evaluation (25% of total)

Enable with `--use-agent`:

- **SecurityAgent**: OWASP Top 10 security analysis (stratified file sampling, max 30 files)
- **LLMQualityAgent**: Detects hallucinations, incomplete implementations, logic errors
- **HallucinationAgent** `[ref]`: DeepEval-based ground truth comparison (reference-only, not scored)

### Runtime & Golden Set Evaluation

Enable with `--run-tests --golden --project <name>`:

- **RuntimeEvaluator**: Builds project, starts server, runs e2e tests
- **Golden Set**: Compares API responses against known-good endpoints
- Golden set weight: 15% (existing phases scaled to 85%)

### Scoring Formula

```
Raw Phase Score = sum(phase_score * phase_weight)
Penalties       = warning + duplication + jsdoc + schemaSync + mapping (max ~65)
Adjusted Phase  = Raw Phase - Penalties

Without agents:  Final Score = Adjusted Phase (100%)
With agents:     Final Score = (Adjusted Phase * 75%) + (Agent Average * 25%)
With golden set: Final Score = (Above * 85%) + (Golden Set * 15%)
```

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Production ready |
| B | 80-89 | Minor improvements needed |
| C | 70-79 | Several issues to address |
| D | 60-69 | Significant problems |
| F | 0-59 | Major issues or gate failure |

## Benchmarking

Auto-discovers models and projects from `autobe-examples/` directory:

```bash
cd packages/estimate

# Scoring only (no LLM calls, fast)
./run-benchmark.sh

# With AI agents (requires OPENROUTER_API_KEY)
./run-benchmark.sh --mode agent

# Full mode (agents + runtime tests + golden set)
./run-benchmark.sh --mode full

# Filter by vendor
./run-benchmark.sh --vendor openai

# Filter by model
./run-benchmark.sh --model kimi-k2.5

# Filter by project
./run-benchmark.sh --project reddit

# Combined filters
./run-benchmark.sh --vendor qwen --project todo --mode agent
```

Results are saved to `reports/benchmark/<model>/<project>/`.

### Compare

Compare multiple projects side by side:

```bash
node dist/bin/estimate.js compare \
  -p "model-a:/path/to/a" "model-b:/path/to/b" \
  -o ./reports/comparison
```

## Environment Variables

Create a `.env` file in `packages/estimate/`:

```bash
OPENROUTER_API_KEY=sk-or-...

# Optional: Langfuse telemetry
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Output

Each evaluation produces two files:

- `estimate-report.md` — Human-readable summary with score breakdown
- `estimate-report.json` — Machine-readable for CI/CD integration

## Sample Output

```
Scoring Phases (75% of total score):
-------------------------------------
   Gate:                    Pass
   Document Quality         100/100
   Requirements Coverage    90/100
   Test Coverage            61/100
   Logic Completeness       100/100
   API Completeness         100/100
-------------------------------------

AI Agents (25% of total score):
-------------------------------------
   SecurityAgent:      85/100
   LLMQualityAgent:    72/100
   HallucinationAgent: 90/100 [ref]
-------------------------------------

Final Score: 85/100 (Grade: B)
```

## Troubleshooting

**Gate keeps failing**
- Use `--continue-on-gate-failure` to see all issues
- Gate uses in-memory compilers — unresolved external modules like `@nestjs/common` are expected

**AI agent errors**
- Check your API key
- OpenRouter model IDs use `provider/model-name` format
- Rate limits are retried automatically

**Build not working**
- Run `corepack pnpm build` first
- Make sure `dist/` directory exists

## License

AGPL-3.0
