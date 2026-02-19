# @autobe/estimate

A CLI tool that evaluates code quality for AutoBE-generated projects.

## Getting Started
```bash
cd packages/estimate
pnpm install
```

Run your first evaluation:
```bash
pnpm start --input /path/to/project --output ./reports --verbose
```

Want AI-powered analysis too? Add the agent flags:
```bash
pnpm start --input /path/to/project --output ./reports --verbose \
  --use-agent --provider openrouter --api-key "your-key"
```

## How It Works

We only score things that AutoBE can actually fix. Stuff like code complexity or duplicate blocks? That's on you to refactor, so we just show it as reference info — but they may trigger penalties if they're excessive.

**Affects your score (70%):**
- Documentation quality
- Requirements coverage
- Test coverage (file count + assertion quality)
- Logic completeness (no TODOs, stub code, empty methods)
- API completeness (provider delegation, no empty endpoints)

**AI Agent evaluation (30%):**
- Security analysis (OWASP Top 10)
- LLM quality analysis (hallucinations, logic errors)

**Reference only (no direct score impact):**
- Code complexity
- Duplicate code blocks
- Naming conventions
- JSDoc comments
- Security patterns

**Penalties (deducted from phase score):**
- Warning penalty: up to -10 if warning ratio > 50%
- Duplication penalty: up to -5 if > 50 duplicate blocks
- JSDoc penalty: up to -5 if > 10% missing

## CLI Options
```bash
pnpm start --input <path> --output <path> [options]
```

| Option | What it does |
|--------|--------------|
| `--input`, `-i` | Project to evaluate (required) |
| `--output`, `-o` | Where to save reports (required) |
| `--verbose`, `-v` | Show detailed logs |
| `--continue-on-gate-failure` | Keep going even if basic checks fail |
| `--use-agent` | Enable AI evaluation (30% of score) |
| `--provider` | Which LLM to use: `claude`, `openai`, or `openrouter` |
| `--api-key` | Your API key |
| `--model` | Specific model (optional) |

You can also set API keys via environment variables:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."    # for claude
export OPENAI_API_KEY="sk-..."           # for openai
export OPENROUTER_API_KEY="sk-or-..."    # for openrouter
```

## Evaluation Pipeline

Here's what happens when you run an evaluation:

### 1. Gate Check (pass/fail)

First, we make sure the code actually compiles. If this fails, you get a 0.

- **TypeScript compilation**: Uses `AutoBeTypeScriptCompiler` (in-memory, no external `tsc` binary required)
- **Prisma schema validation**: Uses `AutoBeDatabaseCompiler.compilePrismaSchemas()` (in-memory, no external `prisma` binary required)

Both compilers run entirely in-memory, so there's no need to install project dependencies or have global toolchains available.

### 2. Scoring Phases (70% of total)

Then we score these five areas:

| Phase | Weight | What we check |
|-------|--------|---------------|
| Document Quality | 20% | Does `docs/analysis/` exist? Is there a README? |
| Requirements Coverage | 25% | Are there controllers, providers, and DTOs? |
| Test Coverage | 20% | Test count, assertion quality, stub detection |
| Logic Completeness | 20% | TODOs, FIXMEs, empty methods, empty catch, stub returns |
| API Completeness | 15% | Endpoint implementation, provider delegation |

### 3. Penalties

After scoring, penalties are applied based on reference metrics:

| Penalty | Trigger | Max Deduction |
|---------|---------|---------------|
| Warning | Warning ratio > 50% | -10 |
| Duplication | > 50 duplicate blocks | -5 |
| JSDoc | > 10% missing | -5 |

### 4. Reference Metrics

We also collect these, but they don't directly affect your score (except through penalties):

- **Complexity**: Functions with cyclomatic complexity > 15
- **Duplication**: Blocks of 10+ identical lines
- **Naming**: Classes/interfaces not following PascalCase
- **JSDoc**: Missing documentation comments
- **Security**: Hardcoded passwords, eval() usage, etc.

### 5. AI Agent Evaluation (30% of total)

If you enable `--use-agent`, two AI agents analyze your code:

**SecurityAgent** reviews `controllers/` and `providers/` based on OWASP Top 10 2025:
- Injection (SQL injection, XSS, shell injection)
- Broken Access Control
- Cryptographic Failures
- Insecure Design
- Security Misconfiguration
- Vulnerable and Outdated Components
- Identification and Authentication Failures
- Software and Data Integrity Failures
- Security Logging and Monitoring Failures
- Server-Side Request Forgery (SSRF)

**LLMQualityAgent** compares `docs/analysis/` with `providers/` to find:
- Hallucinated imports (packages that don't exist)
- Incomplete implementations
- Logic that doesn't match requirements
- Copy-paste errors
- Missing edge case handling

Large codebases are automatically split into chunks and evaluated in parallel. Duplicate issues across chunks are removed using similarity matching.

> **Note:** Without `--use-agent`, agent evaluation is skipped and 100% of the score comes from phases.

## Scoring Formula
```
Raw Phase Score = Σ(phase_score × phase_weight)
Penalties       = warning + duplication + jsdoc (max -20)
Adjusted Phase  = Raw Phase - Penalties

Agent Average   = Σ(agent_scores) / agent_count

Final Score     = (Adjusted Phase × 70%) + (Agent Average × 30%)
```

Without agents enabled:
```
Final Score     = Adjusted Phase (100%)
```

## Comparing Projects

Compare two or more projects side-by-side:
```bash
pnpm run compare \
  --project-a /path/to/project-a \
  --project-b /path/to/project-b \
  --name-a "AutoBE Generated" \
  --name-b "Hand Written" \
  --output ./reports/comparison \
  --verbose
```

With AI agents:
```bash
pnpm run compare \
  --project-a /path/to/project-a \
  --project-b /path/to/project-b \
  --name-a "AutoBE Generated" \
  --name-b "Hand Written" \
  --output ./reports/comparison \
  --use-agent --provider openrouter \
  --verbose
```

The comparison report includes rankings, per-phase score breakdowns, penalty comparison, agent scores, and metric comparisons between projects.

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Production ready |
| B | 80-89 | Minor improvements needed |
| C | 70-79 | Several issues to address |
| D | 60-69 | Significant problems |
| F | 0-59 | Major issues or gate failure |

## Output

You get two files:

- `estimate-report.md` - Human-readable summary with score breakdown
- `estimate-report.json` - Machine-readable for CI/CD

For comparisons, you also get:
- `comparison-report.md` - Side-by-side comparison

## Examples

Basic evaluation:
```bash
pnpm start -i ~/autobe-examples/anthropic/claude-sonnet-4.5/todo -o ./reports -v
```

With AI agents via OpenRouter:
```bash
pnpm start -i ~/project -o ./reports -v \
  --use-agent --provider openrouter --api-key "sk-or-..."
```

Using a specific model:
```bash
pnpm start -i ~/project -o ./reports -v \
  --use-agent --provider openrouter --api-key "sk-or-..." \
  --model "openai/gpt-4o"
```

Sample output:
```
📋 Scoring Phases (70% of total score):
─────────────────────────────────────────
   Gate:                    ✅ Pass
   Document Quality         100/100 ✅
   Requirements Coverage    90/100 ✅
   Test Coverage            98/100 ✅
   Logic Completeness       100/100 ✅
   API Completeness         70/100 📊
─────────────────────────────────────────

📋 Reference Info (no score impact):
─────────────────────────────────────────
   Complexity:    2 complex functions (max: 22)
   Duplication:   102 duplicate blocks
   Naming:        0 issues
   JSDoc:         36 missing
   Security:      0 issues
─────────────────────────────────────────

🤖 AI Agent Evaluations (30% of total score):
─────────────────────────────────────────
   SecurityAgent: 77/100 ⚠️
      Summary: [6 chunks, 68→52 issues] Critical access control flaws...
      Issues found: 52

   LLMQualityAgent: 69/100 ⚠️
      Summary: [4 chunks, 47→47 issues] Multiple critical issues...
      Issues found: 47
─────────────────────────────────────────

📊 Final Score: 77/100 (Grade: C)

   Phase Score:  84/100 × 70% = 59.0
   Agent Score:  73/100 × 30% = 22.0
   ─────────────────────────────
   Total:        77/100
```

## Supported LLM Providers

For AI agent evaluation, you can use:

| Provider | Models |
|----------|--------|
| `claude` | claude-sonnet-4-20250514 (default) |
| `openai` | gpt-4o (default) |
| `openrouter` | Any model they support |

OpenRouter is nice because one API key gets you access to Claude, GPT, Gemini, Llama, and more. Just specify the model like `anthropic/claude-3.5-sonnet` or `openai/gpt-4o`.

## Token Usage

AI agents read your code in chunks, so larger projects use more tokens. Chunks are evaluated in parallel for speed.

| Project Size | Approx Tokens | Chunks |
|--------------|---------------|--------|
| Small (~50 files) | ~30k | 1-2 |
| Medium (~100 files) | ~80k | 2-4 |
| Large (~300+ files) | ~200k+ | 5-10+ |

## Troubleshooting

**Gate keeps failing**
- Try `--continue-on-gate-failure` to see all issues
- Gate uses in-memory compilers, so external module imports (e.g. `@nestjs/common`) will show as unresolved — this is expected behavior

**AI agent errors**
- Make sure your API key is correct
- Check the model ID format (OpenRouter uses `provider/model-name`)
- If you hit rate limits, chunks are retried automatically

**High token usage**
- We only send `controllers/` and `providers/` to AI
- For huge projects, consider evaluating a subset first

## Code Quality

This package follows [Biome](https://biomejs.dev/) lint rules enforced in CI:
- `noUnusedImports` — No unused imports
- `noUnusedVariables` — No unused variables
- `noFloatingPromises` — All promises must be awaited or handled
- `noExplicitAny` — No `any` type usage

## License

MIT