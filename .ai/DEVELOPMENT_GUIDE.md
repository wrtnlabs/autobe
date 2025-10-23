# Development Guide

## Getting Started

AutoBE is a monorepo structure using pnpm workspaces.

### Repository Setup

```bash
git clone https://github.com/wrtnlabs/autobe
cd autobe
pnpm install
pnpm run build
```

### Running in Development

```bash
# Run backend development server
cd packages/backend
pnpm run dev

# Frontend is in separate repository
```

## Project Structure

```
autobe/
├── packages/
│   ├── agent/          # AI agent system
│   ├── compiler/       # 3-tier compiler
│   ├── interface/      # Type definitions
│   ├── backend/        # WebSocket RPC server
│   └── utils/          # Common utilities
├── .ai/                # Claude Code documentation (this folder!)
└── CLAUDE.md           # Project overview (index of document you're reading)
```

## Adding New Features

### 1. Adding New Agents

To add new pipeline stages or agents:

1. Write new System Prompt markdown file in `packages/agent/prompts/`
2. Write new Orchestrator function in `packages/agent/src/orchestrate/`
3. Write or modify History Transformer
4. Add Tool definitions (if needed)
5. Add event types to `@autobe/interface`
6. Build and test: `pnpm run build:prompt && pnpm run build`

### 2. Modifying System Prompts

**Absolute Principle**: User instructions are absolute. If unclear, ask questions. If clear, execute unconditionally.

System Prompt modification is very sensitive work. Always read [AGENT_SYSTEM_PROMPTS.md](AGENT_SYSTEM_PROMPTS.md) thoroughly before working.

1. Fully read target prompt file (`packages/agent/prompts/*.md`)
2. Reference related Orchestrator, Tool, History code
3. Modify by integrating naturally into existing storyline
4. Run `pnpm run build:prompt` to generate `AutoBeSystemPromptConstant.ts`
5. Validate by running actual pipeline

**Important**: `packages/agent/src/constants/AutoBeSystemPromptConstant.ts` is an auto-generated file. Don't edit directly - modify source `.md` files and build.

### 3. Extending Compiler

To add new validation rules:

1. Modify corresponding compiler code in `packages/compiler/src/`
2. Add diagnostic message types to `@autobe/interface`
3. Modify Orchestrator to handle new diagnostic information
4. Write and verify tests

### 4. Adding Types

When adding new types to `@autobe/interface`:

1. All dependent packages are affected
2. Must resolve all compilation errors
3. Proceed carefully with breaking changes

## Debugging

### Analyzing Event Logs

All events are logged. When problems occur, trace event logs to identify which agent failed when.

### Tracking Compiler Errors

When compilation errors occur:
1. Check which file has errors
2. Identify agent that generated the file
3. Review agent's System Prompt and History
4. Modify prompts if needed

### Debugging LLM Responses

If LLM responses are strange:
1. Verify System Prompt is clear
2. Verify History contains all necessary context
3. Verify Tool schema is accurate
4. Improve by adding examples to prompt

## Testing

### Unit Tests

Each package can be tested independently:

```bash
cd packages/agent
pnpm test
```

### Integration Tests

To test entire pipeline:

```bash
pnpm run test:e2e
```

### Manual Testing

Run pipeline with actual requirements and verify results. Verify generated code compiles and passes tests.

## Code Exploration

### Finding Specific Features

Search by file name or function name:
```bash
# Find Realize Write Orchestrator
rg "orchestrateRealizeWrite"

# Find System Prompt
ls packages/agent/prompts/REALIZE_WRITE.md
```

### Tracking Type Definitions

Find types in `@autobe/interface` and use "Find References" to track usage. TypeScript's type system tracks all dependencies.

### Tracking Event Flow

Search for specific event types to identify publication and subscription locations. Event sourcing pattern makes data flow clear.

## Best Practices

- Modify System Prompts carefully, commit after testing
- Commit type changes after verifying all dependent packages compile
- Start new features small and expand gradually
- Keep documentation current (especially this `.ai/` folder!)
- Write clear commit messages

## Common Issues

### Prompt Build Errors

If `pnpm run build:prompt` fails, check `.md` file syntax. Especially verify code blocks are properly closed.

### Compiler Timeout

If compilation takes too long, verify Incremental Compilation is working properly. Check logs for repeated full recompilations.

### LLM API Errors

Retry logic works when rate limits or timeouts occur. Check API key and quotas.

## Contributing

Discussion on Discord is recommended before contributing: https://discord.gg/aMhRmzkqCx

Pull Requests should be submitted with clear explanations and must pass all tests.

## Documentation

Update related documentation when code changes:
- System Prompt changes → Update `AGENT_SYSTEM_PROMPTS.md`
- Architecture changes → Update `ARCHITECTURE.md`
- New features → Update `DEVELOPMENT_GUIDE.md` and `CLAUDE.md`

AutoBE values matching documentation with code. Documents in this `.ai/` folder referenced by Claude Code must always stay current.
