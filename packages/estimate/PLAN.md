# @autobe/estimate Project Plan

## What is this?

A CLI tool that evaluates code quality for AutoBE-generated projects. It scores the code, finds issues, and can compare generated code against a baseline (like the original open-source project).

## Current Status (v0.2.0)

We've built the core evaluation system:

**Scoring (affects the final grade):**
- Gate check (syntax, types, prisma validation)
- Document quality
- Requirements coverage
- Test coverage
- Logic completeness
- API completeness

**Reference only (doesn't affect score):**
- Code complexity
- Duplicate blocks
- Naming conventions
- JSDoc coverage
- Security patterns

**AI Agents (reference only):**
- SecurityAgent - finds security vulnerabilities
- LLMQualityAgent - catches common AI-generated code mistakes

## This Week's Goals

### 1. Fix PR Review Comments

The PR got feedback from the team. Here's what needs fixing:

**Build errors (from Copilot):**
- Remove unused imports
- Fix package.json paths
- Sync version numbers
- Fix indentation bugs

**Code quality (from sunrabbit123):**
- Use commander + @clack/prompts for CLI
- Use FileSystemIterator.save for file operations
- Use openai sdk instead of raw fetch
- Use ArrayUtil.deduplicate and StringUtil.trim from @autobe/utils
- Refactor markdown reporter to declarative style

**Required (from samchon):**
- Create prompt files for the agents

### 2. Clean Up the Code

- Remove duplicate code
- Simplify file structure
- Delete unused files

### 3. Add Comparison Mode

This is the big feature. We want to compare AutoBE-generated code against an original codebase.

**New CLI options:**
```bash
pnpm start --compare \
  --baseline ./odoo-original \
  --target ./autobe-generated \
  --output ./comparison-report
```

**What we'll compare:**
- API structure (endpoints, methods)
- Database schema (tables, fields, relations)
- Code metrics (complexity, duplication)
- Feature coverage (what's implemented vs missing)

### 4. Extract Requirements from Odoo

We'll pick one Odoo module and:
- Extract its structure (models, controllers, views)
- Generate requirements document
- Use that to generate code with AutoBE
- Compare the result against the original

**Possible modules to start with:**
- sale (sales orders)
- stock (inventory)
- purchase (purchasing)

We'll pick a small one first.

### 5. Run the Comparison

Once everything's ready:
- Generate code from Odoo requirements
- Run comparison evaluation
- Analyze the results
- Document findings

## File Structure
```
packages/estimate/
├── src/
│   ├── agents/           # AI evaluation agents
│   ├── core/             # Pipeline and context
│   ├── evaluators/       # All evaluators
│   │   ├── gate/         # Syntax, Type, Prisma
│   │   ├── scoring/      # Doc, Req, Test, Logic, API
│   │   ├── quality/      # Complexity, Duplication, etc
│   │   └── safety/       # Security checks
│   ├── reporters/        # Markdown and JSON output
│   ├── compare/          # NEW: Comparison logic
│   └── cli.ts
├── prompts/              # NEW: Agent prompts
├── PLAN.md               # This file
└── README.md
```

## Timeline

| Day | Task |
|-----|------|
| Mon | Fix build errors, create prompt files |
| Tue | Refactor code (sunrabbit123 feedback) |
| Wed | Add comparison mode |
| Thu | Odoo module selection + requirements extraction |
| Fri | Run comparison, document results |

## Open Questions

- Which Odoo module should we start with?
- How do we extract requirements automatically?
- Should comparison scores affect the final grade?

## Notes

- AI agent results are reference only (don't affect score)
- Focus on what AutoBE can actually improve
- Keep the tool simple and fast
