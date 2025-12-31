# AutoBE Project Context for Claude Code

## What is AutoBE?

AutoBE is an AI-powered no-code system that automatically generates production-ready backend applications from natural language requirements. Users describe their backend needs through a chat interface, and AutoBE generates a complete TypeScript + NestJS + Prisma application.

**Core Capabilities**:
- 100% compilation guarantee
- Full type safety across the stack
- Comprehensive documentation (ERD, OpenAPI, API docs)
- Complete E2E test coverage
- Clean, maintainable implementation code

**Generated Outputs**:
Requirements Analysis → Database Schema (Prisma) → API Specification (OpenAPI) → E2E Tests → API Implementation → Type-Safe SDK

## Three Fundamental Concepts

### 1. Waterfall + Spiral Pipeline

AutoBE follows a 5-phase waterfall with internal spiral loops:

**Requirements** → **Analyze** → **Database** → **Interface** → **Test** → **Realize**

Each phase has 40+ specialized AI agents that collaborate. Failures trigger spiral loops that regenerate and correct until success.

### 2. Compiler-Driven Development

Three-tier validation ensures 100% compilation:

**AutoBE Prisma Compiler** → **AutoBE OpenAPI Compiler** → **TypeScript Compiler**

Compiler diagnostics feed back to AI agents, creating self-healing loops that automatically correct errors.

### 3. Vibe Coding

Conversation becomes software through automatic transformation:

**Conversation** → **Requirements** → **AST** → **Code** → **Application**

The entire pipeline is event-driven, with 65+ event types tracking progress in real-time.

## Documentation Index

Detailed documentation is organized by topic. **Always consult relevant documents before making changes.**

### Architecture & Design
- **[ARCHITECTURE.md](.ai/ARCHITECTURE.md)** - Overall system architecture, three paradigms, package structure
- **[STATE_MACHINE.md](.ai/STATE_MACHINE.md)** - Step counter pattern, automatic state invalidation
- **[AST_DESIGN.md](.ai/AST_DESIGN.md)** - Simplified AST philosophy for AI generation

### Agent System (`@autobe/agent`)
- **[AGENTICA_INTEGRATION.md](.ai/AGENTICA_INTEGRATION.md)** - MicroAgentica pattern, IPointer, function calling abstraction
- **[FUNCTION_CALLING.md](.ai/FUNCTION_CALLING.md)** - Facade pattern, LLM autonomous decision making
- **[AGENT_ORCHESTRATION.md](.ai/AGENT_ORCHESTRATION.md)** - Hierarchical orchestration, batch processing, self-healing loops
- **[AGENT_SYSTEM_PROMPTS.md](.ai/AGENT_SYSTEM_PROMPTS.md)** - System prompt design and editing guide ⭐ **Most Important!**
- **[AGENT_TOOLS.md](.ai/AGENT_TOOLS.md)** - Function calling tool definitions
- **[AGENT_HISTORIES.md](.ai/AGENT_HISTORIES.md)** - Context optimization with prompt caching

### Compiler System (`@autobe/compiler`)
- **[COMPILER_SYSTEM.md](.ai/COMPILER_SYSTEM.md)** - Three-tier validation, diagnostic generation, feedback loops

### Type System & Communication
- **[TYPE_SYSTEM.md](.ai/TYPE_SYSTEM.md)** - @autobe/interface, discriminated unions, Typia, TGrid RPC
- **[EVENT_SYSTEM.md](.ai/EVENT_SYSTEM.md)** - 65+ event types, type-safe mapper, WebSocket streaming
- **[RPC_SYSTEM.md](.ai/RPC_SYSTEM.md)** - WebSocket-based type-safe RPC communication

### Performance
- **[OPTIMIZATION.md](.ai/OPTIMIZATION.md)** - Prompt caching, batch processing, concurrency control

### Frontend & UI (`@autobe/ui`, Website, Apps)
- **[FRONTEND_SYSTEM.md](.ai/FRONTEND_SYSTEM.md)** - UI components, real-time communication, session management

### Development
- **[DEVELOPMENT_GUIDE.md](.ai/DEVELOPMENT_GUIDE.md)** - Adding features, debugging, code navigation
- **[BEST_PRACTICES.md](.ai/BEST_PRACTICES.md)** - System prompt editing, optimization, troubleshooting

## Quick Start for Claude Code

### First Time Working on AutoBE
1. Read [ARCHITECTURE.md](.ai/ARCHITECTURE.md) - Understand system fundamentals
2. Read [AGENTICA_INTEGRATION.md](.ai/AGENTICA_INTEGRATION.md) - Understand agent structure
3. Read package-specific documentation for your work area

### Editing System Prompts (Most Important!)

**Absolute Rule**: User instructions are absolute. Claude Code must NEVER modify, reduce, or omit user commands based on its own judgment.

**Before Editing**:
1. **Read [AGENT_SYSTEM_PROMPTS.md](.ai/AGENT_SYSTEM_PROMPTS.md)** completely
2. Read the target prompt file fully
3. Review related Orchestrator code (`packages/agent/src/orchestrate/`)
4. Review related Tool definitions
5. Review related History transformers

**When Editing**:
- Integrate naturally into existing storyline
- Write clear, specific instructions
- Include rich examples
- Specify constraints explicitly
- Use positive directives ("do X" not "don't do Y")

**After Editing - CRITICAL**:
1. **STOP** - Your editing task is complete
2. Do **NOT** run `pnpm run build:prompt` unless user explicitly requested it
3. Do **NOT** run `pnpm run build` or `pnpm run test`
4. Do **NOT** run `git commit` or any git commands
5. Do **NOT** suggest or execute ANY additional steps

**The User Will Decide**:
- Whether to build the prompts
- Whether to test the changes
- Whether to commit the changes
- When to proceed with next steps

**Never**:
- Edit `AutoBeSystemPromptConstant.ts` directly (auto-generated)
- Run build/test/commit commands without explicit user request
- Assume what the user wants to do next
- Take "helpful" actions on your own initiative

### Adding New Features
1. Consult [DEVELOPMENT_GUIDE.md](.ai/DEVELOPMENT_GUIDE.md)
2. Analyze similar existing features
3. Reference relevant architecture documents
4. Follow type-driven development workflow

### Debugging Issues
1. Check [BEST_PRACTICES.md](.ai/BEST_PRACTICES.md) debugging section
2. Analyze event logs and compiler errors
3. Review related Orchestrators and System Prompts
4. Check state machine step counters

## Absolute Rules for Claude Code

### 1. DO ONLY WHAT USER EXPLICITLY REQUESTED - NOTHING MORE

**CRITICAL**: Execute ONLY what the user explicitly requested. Do NOT take ANY additional actions based on your own judgment or assumptions.

**Strictly Forbidden Without Explicit User Request**:
- Running `pnpm run build`, `pnpm run test`, `npm install`, or ANY build/test commands
- Executing `git commit`, `git push`, or ANY git commands
- Running ANY command-line tools beyond what user specifically asked for
- Making "helpful" suggestions and then executing them automatically
- Adding "just in case" validations or checks
- Performing "best practice" follow-up tasks

**The ONLY Exception**: When user asks to edit system prompts, you MAY run `pnpm run build:prompt` ONLY if the user explicitly asked you to build the prompts. Otherwise, DO NOT run it.

**If You Want to Suggest Additional Steps**:
1. Complete the user's explicit request FIRST
2. STOP and ASK the user: "Would you like me to [specific action]?"
3. WAIT for explicit confirmation
4. NEVER assume "yes" - the user might have reasons to say no

**Examples of Correct Behavior**:
- User: "Edit the REALIZE_WRITE.md prompt to add error handling instructions"
- You: [Edit the file] → DONE. Do NOT run build:prompt, do NOT run tests, do NOT commit
- User: "Fix the compilation error in UserController.ts"
- You: [Fix the error] → DONE. Do NOT run build, do NOT run tests, do NOT commit

**Examples of WRONG Behavior** (NEVER DO THIS):
- User: "Edit the prompt" → You: [Edit] + [Run build:prompt] + [Run tests] ❌ WRONG
- User: "Fix the bug" → You: [Fix] + [Run tests] + [Commit] ❌ WRONG
- User: "Add a new feature" → You: [Implement] + [Build] + [Test] + [Commit] ❌ WRONG

### 2. User Command Supremacy
User instructions are absolute. If unclear, ask questions. If clear, execute exactly as specified without modification. DO NOT add your own ideas, suggestions, or "improvements" unless explicitly asked.

### 3. System Prompt Editing Sensitivity
System prompt editing is the most critical and sensitive task in AutoBE development. **Always** read [AGENT_SYSTEM_PROMPTS.md](.ai/AGENT_SYSTEM_PROMPTS.md) completely before editing any prompt.

**When Editing System Prompts**:
1. Edit the prompt file(s) as requested
2. STOP - Your task is complete
3. Do NOT run `pnpm run build:prompt` unless user explicitly asked
4. Do NOT run any build, test, or git commands
5. Do NOT suggest or perform "next steps"

### 4. Build System Awareness
- `packages/agent/src/constants/AutoBeSystemPromptConstant.ts` is auto-generated
- Edit source files in `packages/agent/prompts/*.md`
- Run `pnpm run build:prompt` after changes
- Never commit without testing

### 5. Type Safety First
- All types defined in `@autobe/interface`
- Use discriminated unions with mapper pattern
- Never use `any` type
- Leverage Typia for runtime validation

### 6. Event-Driven Architecture
- All state changes emit events
- 65+ event types cover entire pipeline
- Events enable real-time progress tracking
- Event history allows state reconstruction

## Critical File Locations

### Agent System
- **Facade Functions**: `packages/agent/src/factory/createAutoBeApplication.ts:28-111`
- **Context Factory**: `packages/agent/src/factory/createAutoBeContext.ts`
- **Orchestrators**: `packages/agent/src/orchestrate/*/`
- **System Prompts**: `packages/agent/prompts/*.md`
- **History Transformers**: `packages/agent/src/orchestrate/*/histories/`

### Compiler System
- **Prisma Compiler**: `packages/compiler/src/prisma/AutoBeDatabaseCompiler.ts`
- **OpenAPI Compiler**: `packages/compiler/src/interface/AutoBeInterfaceCompiler.ts`
- **TypeScript Compiler**: `packages/compiler/src/AutoBeTypeScriptCompiler.ts`

### Type System
- **All Types**: `packages/interface/src/`
- **Events**: `packages/interface/src/events/`
- **Histories**: `packages/interface/src/histories/`
- **OpenAPI AST**: `packages/interface/src/openapi/AutoBeOpenApi.ts`

### RPC & Frontend
- **RPC Service**: `packages/rpc/src/AutoBeRpcService.ts`
- **UI Components**: `packages/ui/src/`
- **Website**: `packages/website/`

## Development Workflow

### Type-Driven Development
1. Define types in `@autobe/interface`
2. Add to discriminated union and mapper
3. Implement in other packages
4. Types enforce correctness at compile time

### Event-Driven Updates
1. Emit events at key orchestration points
2. Events automatically stream via RPC
3. Frontend subscribes to relevant events
4. State reconstructs from event history

### Compiler-Driven Quality
1. Generate code via LLM
2. Validate with appropriate compiler
3. Extract diagnostics on failure
4. Pass to Correct orchestrator
5. Regenerate with fixes
6. Repeat until success

## Common Tasks

### Adding a New Event Type
1. Define in `packages/interface/src/events/`
2. Add to `AutoBeEvent` union
3. Add to `AutoBeEvent.Mapper`
4. Add to `IAutoBeRpcListener`
5. Emit from orchestrator: `ctx.dispatch(event)`
6. **No RPC code changes needed** - automatic forwarding!

### Modifying System Prompt
1. Read [AGENT_SYSTEM_PROMPTS.md](.ai/AGENT_SYSTEM_PROMPTS.md)
2. Edit `packages/agent/prompts/*.md`
3. Run `pnpm run build:prompt`
4. Test with actual generation
5. Verify output quality

### Adding New Orchestrator
1. Study existing orchestrators
2. Follow hierarchical pattern
3. Use `executeCachedBatch` for parallelization
4. Emit events at key points
5. Integrate compiler feedback loops
6. Update state on completion

## Performance Considerations

- **Prompt Caching**: First task sequential (establish cache), rest parallel
- **Batch Processing**: Use `executeCachedBatch` pattern everywhere
- **Concurrency**: Semaphore limits compilations to 2
- **Incremental Compilation**: Reuse prior TypeScript program
- **Token Optimization**: History transformers curate minimal context

## Repository Information

- **Repository**: https://github.com/wrtnlabs/autobe
- **Documentation**: https://autobe.dev/docs/
- **Main Branch**: `main`
- **License**: AGPL 3.0
- **Discord**: https://discord.gg/aMhRmzkqCx

---

**Version**: 2.1.0
**Last Updated**: 2025-01-23

This document provides Claude Code with essential context for understanding and contributing to AutoBE. For detailed technical information, always consult the specific documentation files listed above.
