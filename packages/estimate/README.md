# @autobe/estimate

Automated evaluation tool for AutoBE-generated backend projects. Scores code quality through static analysis and AI agent evaluation on a 0-100 scale (grades A-F).

## Setup

```bash
# From autobe repo root
corepack pnpm install

# Set your OpenRouter API key (required for AI agent evaluation)
cp packages/estimate/.env.example packages/estimate/.env
# Edit .env and set OPENROUTER_API_KEY=sk-or-...
```

## Quick Start

```bash
# Evaluate a single project (static analysis + AI agents, enabled by default)
corepack pnpm estimate -- -i <project-path> -o <output-path>

# Static analysis only (disable AI agents)
corepack pnpm estimate -- -i <project-path> -o <output-path> --no-agent
```

## Commands

### evaluate (default)

Evaluate a single AutoBE-generated project.

```bash
corepack pnpm estimate -- -i <project-path> -o <output-path>
corepack pnpm estimate -- -i <project-path> -o <output-path> --golden --project todo
```

### batch

Run evaluation across all models/projects in the `autobe-examples` directory. This is what `run-benchmark.sh` uses internally.

```bash
# All models x all projects
corepack pnpm estimate

# Filter by model or project
corepack pnpm estimate -- --model glm-5
corepack pnpm estimate -- --project todo
corepack pnpm estimate -- --model glm-5 --project todo
```

> The `autobe-examples` directory should be located next to the autobe repo. Use `--examples <path>` to specify a custom path.

### diagnose

Diagnose compile errors using LLM-powered 7-step forensic analysis. Outputs a markdown diagnosis report.

```bash
# Evaluate project first, then diagnose
corepack pnpm estimate diagnose -- -i <project-path> -o <output-path> --api-key <key>

# Use an existing report
corepack pnpm estimate diagnose -- --report <report.json> -o <output-path> --api-key <key>
```

### compare

Compare multiple model results side by side.

```bash
corepack pnpm estimate compare -- -p "modelA:path/a" "modelB:path/b" -o <output-path>
```

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input <path>` | (required) | Input project path |
| `-o, --output <path>` | (required) | Output directory for reports |
| `--no-agent` | agent=true | Disable AI agent evaluation |
| `--api-key <key>` | env | API key (or `OPENROUTER_API_KEY` env var) |
| `--provider <name>` | openrouter | LLM provider |
| `--continue-on-gate-failure` | false | Continue evaluation even if gate fails |
| `--golden` | false | Include Golden Set evaluation |
| `--project <name>` | - | Project type (todo\|bbs\|reddit\|shopping\|erp\|gauzy) |
| `--run-tests` | false | Start Docker server and run E2E tests |
| `--auto-fix` | false | Auto-fix simple issues after evaluation |
| `-v, --verbose` | false | Verbose output |

## Evaluation Phases

| Phase | Weight | Description |
|-------|--------|-------------|
| Gate (Type Check) | pass/fail | TypeScript compilation + ESLint (must pass) |
| Document Quality | 5% | Documentation quality |
| Requirements Coverage | 20% | Requirements fulfillment |
| Test Coverage | 20% | Test coverage |
| Logic Completeness | 30% | Business logic completeness |
| API Completeness | 10% | API endpoint completeness |
| Golden Set | 15% | E2E scenario tests (when `--golden` is used) |

### AI Agent Evaluators

When agent evaluation is enabled (default), three AI agents provide deeper analysis:

| Agent | Weight | Description |
|-------|--------|-------------|
| Security | 40% | Security vulnerability analysis |
| LLM Quality | 30% | Code quality deep analysis |
| Hallucination | 30% | Detects unimplemented functions and fake logic |

## Output Files

Reports are generated in the output directory:

- `estimate-report.json` - Full evaluation result (scores, grade, phase details)
- `estimate-report.md` - Markdown report with Fix Advisory (prioritized fix suggestions)
- `diagnosis.md` - Compile error diagnosis (when using `diagnose` command)
