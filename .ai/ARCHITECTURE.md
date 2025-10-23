# Architecture

## System Overview

AutoBE is an AI-powered no-code system that automatically generates production-ready backend applications from natural language requirements. Users describe their backend needs through a chat interface, and AutoBE produces a complete TypeScript + NestJS + Prisma backend application with guaranteed compilation, comprehensive documentation, and E2E tests.

**Key Guarantees:**
- 100% Compilation Success - All generated code passes TypeScript compilation
- Complete Type Safety - End-to-end type contracts from database to API
- Production Quality - ERD diagrams, OpenAPI specs, E2E tests, clean implementation
- Self-Healing - Automatic error correction through compiler feedback loops

**Generated Artifacts:**
Requirements Analysis → Database Schema (Prisma) → API Specification (OpenAPI) → E2E Tests → API Implementation → Type-Safe SDK

## Architectural Foundation

AutoBE's architecture is built on three fundamental paradigms that work together to ensure reliability and quality.

### Paradigm 1: Waterfall + Spiral Methodology

AutoBE executes backend generation through a 5-phase pipeline where each phase builds upon the previous one. This combines the clarity of waterfall development with the flexibility of spiral iteration.

**The Five Phases:**

1. **Requirements**: Collect natural language requirements through conversational chat
2. **Analyze**: Transform requirements into structured analysis documents (actors, use cases, specifications)
3. **Prisma**: Design database schema with tables, relationships, indexes, constraints
4. **Interface**: Generate OpenAPI specification defining all API endpoints and DTO types
5. **Test**: Create E2E test suites that validate every endpoint
6. **Realize**: Implement NestJS APIs with controllers, services, and Prisma integration

**Waterfall Aspect**: Phases execute sequentially. Prisma cannot run until Analyze completes. Interface cannot run until Prisma completes. This enforces dependency ordering and ensures each phase has the prerequisites it needs.

**Spiral Aspect**: Within each phase, compilation feedback creates iteration loops. If the Interface compiler detects errors in the generated OpenAPI document, the Interface agent regenerates the problematic operations until compilation succeeds. This self-correction mechanism is what enables the 100% compilation guarantee.

**Implementation**: `packages/agent/src/factory/createAutoBeApplication.ts:28-111` defines five facade functions (`analyze()`, `prisma()`, `interface()`, `test()`, `realize()`) that orchestrate the pipeline. Each function validates prerequisites, executes its phase, and updates the global state.

### Paradigm 2: Compiler-Driven Development

The second paradigm is the three-tier compilation system that validates every artifact before proceeding.

**Tier 1: AutoBE Prisma Compiler**

Validates Prisma schema files for correctness. Checks table definitions, field types, relationships (`@relation` attributes), indexes, and constraints. Detects cyclic references, missing foreign keys, invalid relationship configurations.

On success, generates ERD diagrams (Mermaid format) and Prisma Client types for type-safe database access.

On failure, returns structured diagnostics indicating which model or field has errors and how to fix them. The Prisma agent uses this feedback to regenerate corrected schemas.

**Tier 2: AutoBE OpenAPI Compiler**

Transforms OpenAPI documents into AutoBE's simplified AST format. Validates spec compliance, checks consistency with Prisma schema (ensuring all referenced fields actually exist in the database), detects path conflicts and schema circular references.

Generates complete NestJS project templates including controller skeletons, DTO types, and module configurations. Also produces type-safe client SDKs.

Returns detailed diagnostics when validation fails, such as "POST /api/users references field 'deleted_at' in request body, but this field does not exist in the User table in Prisma schema."

**Tier 3: TypeScript Compiler**

The final validation gate. Uses the embedded TypeScript compiler to verify all generated code. Detects type errors, syntax errors, module resolution errors, missing imports.

Provides diagnostic information including file path, line number, column number, error message, and error code. This enables the Correct agent to precisely target fixes.

Supports incremental compilation for performance - only changed files are recompiled using dependency graph tracking.

**Compiler Integration**: `packages/compiler/src/AutoBeCompiler.ts` exposes a unified interface:

```typescript
export class AutoBeCompiler implements IAutoBeCompiler {
  public prisma: IAutoBePrismaCompiler;
  public interface: IAutoBeInterfaceCompiler;
  public typescript: IAutoBeTypeScriptCompiler;
  public test: IAutoBeTestCompiler;
  public realize: IAutoBeRealizeCompiler;
}
```

Each compiler is invoked by orchestrators after code generation. The feedback loop (Write → Compile → Correct → Compile) repeats until compilation succeeds or max retries are reached.

### Paradigm 3: Vibe Coding

"Conversation becomes software." AutoBE embodies the philosophy that natural language dialogue can directly transform into executable backend applications without manual coding.

**The Transformation Pipeline**: Natural Language → Structured Requirements → AST → Type-Safe Code → Running Application

Traditional development requires developers to translate requirements into design documents, then into code, then test and debug. AutoBE automates this entire pipeline. A user says "I need user authentication", and AutoBE analyzes the intent, designs a User table with email/password fields, generates signup/login APIs, implements JWT token issuance logic, and creates tests - all automatically.

**Conversational State Management**: Every user message and AI response is recorded as an event. This event stream becomes the development history. If the user adds "oh, and make that API admin-only", AutoBE retains the previous context and adds authorization logic incrementally.

**Function Calling as Intent Recognition**: AutoBE doesn't just parse text. It uses Claude's function calling to identify user intent and map it to actions. When the user says "add authentication", the LLM recognizes this requires running the `interface()` function with parameters describing the authentication requirement.

**AST as the Contract**: The key insight is using Abstract Syntax Trees as the intermediate representation. Natural language is unstructured and ambiguous, but AST is structured and precise. AutoBE transforms conversations into JSON ASTs that compilers can validate. This bridges the gap between human intent and machine-verifiable code.

**Implementation**: `packages/agent/src/context/IAutoBeFacadeApplication.ts` defines the facade interface that the LLM interacts with through function calling. Each function represents a high-level development intent (analyze, design database, define APIs, write tests, implement).

## Package Architecture

AutoBE is organized as a monorepo with clear dependency layers enforcing architectural boundaries.

### Dependency Hierarchy

```
         ┌──────────────┐
         │  @autobe/ui  │  (React components, WebSocket client)
         └──────┬───────┘
                │
         ┌──────▼───────┐
         │@autobe/backend│  (WebSocket RPC server)
         └──────┬───────┘
                │
         ┌──────▼───────┐
         │ @autobe/agent│  (Core orchestration engine)
         └──┬─────┬────┘
            │     │
   ┌────────▼─┐ ┌▼──────────┐
   │@autobe/  │ │ @autobe/  │
   │ compiler │ │   rpc     │
   └────┬─────┘ └───────────┘
        │
   ┌────▼──────┬───────────┐
   │ @autobe/  │ @autobe/  │
   │filesystem │   utils   │
   └────┬──────┴───────┬───┘
        │              │
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │@autobe/      │  (Type contracts - bottom layer)
        │  interface   │  (No external dependencies)
        └──────────────┘
```

**Design Principle**: Bottom-up type safety. The interface package defines all types with no dependencies. Every higher layer references these types, creating a compile-time contract enforced across the entire system.

### Core Packages

**`@autobe/interface`**: Type definitions and contracts. Contains all event types (`AutoBeEvent`), history types (`AutoBeHistory`), OpenAPI AST definitions (`AutoBeOpenApi`), RPC listener interfaces, compiler result types. This package has NO dependencies except `typia` and `@samchon/openapi`, making it the immutable foundation of the type system.

**Location**: `packages/interface/src/`

Key files:
- `events/AutoBeEvent.ts` - 65+ event type definitions with type-safe mapper
- `histories/AutoBeHistory.ts` - Discriminated union of all history types
- `openapi/AutoBeOpenApi.ts` - Simplified OpenAPI AST
- `rpc/IAutoBeRpcListener.ts` - WebSocket event listener interface

**`@autobe/utils`**: Utility functions for transformations. Includes OpenAPI document conversion, test validation helpers, file system utilities.

**`@autobe/filesystem`**: Virtual file system abstractions. Provides in-memory file tree representations for generated code before writing to disk. Enables preview and validation without side effects.

**`@autobe/compiler`**: Three-tier compilation system. Implements Prisma schema validation, OpenAPI-to-NestJS code generation, and TypeScript compilation. Each compiler returns structured diagnostics for AI agents to consume.

**Location**: `packages/compiler/src/`

Structure:
- `prisma/` - Prisma schema compiler using EmbedPrisma
- `interface/` - OpenAPI compiler with Nestia integration
- `typescript/` - TypeScript compiler with ESLint
- `AutoBeCompiler.ts` - Unified compiler facade

**`@autobe/rpc`**: WebSocket RPC service wrapper. Bridges local agents to remote clients over WebSocket using TGrid. Automatically forwards all agent events to connected clients using reflection-based event dispatching.

**Location**: `packages/rpc/src/AutoBeRpcService.ts`

Key pattern: Uses `typia.misc.literals<>()` to iterate over all `IAutoBeRpcListener` method names and automatically register event forwarding handlers.

**`@autobe/agent`**: Core orchestration engine. This is the "brain" of AutoBE containing all pipeline logic, agent orchestrators, system prompts, history transformers, and the facade application that LLMs interact with.

**Location**: `packages/agent/src/`

Critical subdirectories:
- `orchestrate/` - Phase orchestrators (analyze, prisma, interface, test, realize)
- `prompts/` - 30+ markdown files defining system prompts
- `factory/` - Creates AutoBeApplication facade and context
- `context/` - State management and conversation context
- `utils/` - Batch processing, retry logic, caching utilities

**`@autobe/backend`**: WebSocket RPC server implementation. Exposes AutoBE agent functionality over WebSocket for remote access from frontends.

**`@autobe/ui`**: React component library for building AutoBE frontends. Provides chat interface, event visualization, progress tracking, session management.

### Application Packages

**Playground** (`apps/playground-ui`, `apps/playground-server`): Online development environment where users can try AutoBE in the browser. Integrates with StackBlitz for live code execution.

**VSCode Extension** (`apps/vscode-extension`): IDE integration allowing developers to use AutoBE directly in Visual Studio Code.

**Hackathon Platform** (`apps/hackathon-ui`, `apps/hackathon-server`, `apps/hackathon-api`): Event-based demonstration platform showcasing AutoBE capabilities.

## Event-Driven Architecture

AutoBE uses event sourcing patterns for state management and progress tracking.

### Event System

Every state change in AutoBE is represented as an event. The current state can be reconstructed by replaying the event stream. This enables time-travel debugging, reproducible builds, and transparent progress tracking.

**Event Types**: 65+ distinct event types organized by phase. Each phase has Start, Progress, Complete events plus phase-specific events like Scenario, Write, Review, Validate, Correct.

**Location**: `packages/interface/src/events/AutoBeEvent.ts`

```typescript
export type AutoBeEvent =
  | AutoBeUserMessageEvent
  | AutoBeAssistantMessageEvent
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeScenarioEvent
  | AutoBeAnalyzeWriteEvent
  | AutoBeAnalyzeReviewEvent
  | AutoBeAnalyzeCompleteEvent
  | AutoBePrismaStartEvent
  // ... 60+ more event types
```

**Type-Safe Event Mapper**: Each event type maps to its interface through a compile-time type:

```typescript
export namespace AutoBeEvent {
  export type Type = AutoBeEvent["type"];  // Union of all event type strings
  export interface Mapper {
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeScenario: AutoBeAnalyzeScenarioEvent;
    analyzeWrite: AutoBeAnalyzeWriteEvent;
    // ... complete type-safe mapping
  }
}
```

This enables generic event handling with full type inference. Functions can accept `AutoBeEvent.Type` and get the correct event interface through mapped types.

### State Machine

AutoBE implements a state machine where transitions are validated and state invalidation is automatic.

**State Definition**: `packages/agent/src/context/AutoBeState.ts`

```typescript
export interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;
  prisma: AutoBePrismaHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
}
```

**Step Counter Pattern**: Each history includes a `step` number that increments on each execution. When Analyze runs, its step counter increments. All dependent phases (Prisma, Interface, Test, Realize) track the Analyze step they were built against. If Analyze reruns and its step changes, all dependent phases become "out-of-date" and must be re-executed.

**Implementation**: `packages/agent/src/orchestrate/facade/transformFacadeStateMessage.ts`

The facade validates state before allowing phase execution. Attempting to run Interface when Prisma is out-of-date results in an error message explaining the prerequisite.

**State Immutability**: While the state object itself is mutable (for performance), state transitions are atomic. Event dispatch and state updates happen in a single transaction, preventing inconsistent intermediate states.

## Agent System Integration

AutoBE doesn't directly call LLMs. It uses the Agentica framework to abstract LLM interactions and enable function calling.

### Agentica Framework

**What is Agentica**: A function-calling framework that wraps LLM providers (Claude, GPT, Gemini) with a unified interface. Agents define TypeScript functions with schemas, and the LLM decides which functions to call based on conversation context.

**How AutoBE Uses It**: AutoBE creates `MicroAgentica` instances - lightweight agents with specific schemas - for each orchestration task. The agent defines what function calling tools are available, and the LLM selects which tools to invoke.

**Location**: `packages/agent/src/factory/createAutoBeContext.ts:103-203` - The `conversate()` function creates MicroAgentica instances internally.

```typescript
conversate: async (props) => {
  const micro = new MicroAgentica<T, P>({
    model: props.controller.model,
    application: props.controller.application,
  });

  const { result } = await micro.converse({
    histories: props.histories,
    // ... configuration
  });

  return result;
}
```

**Key Insight**: Each orchestrator creates a fresh MicroAgentica instance with a schema tailored to its specific task. The Analyze Write orchestrator exposes a schema for writing analysis documents. The Interface Operation orchestrator exposes a schema for generating OpenAPI operations. This specialization improves output quality.

**Schema Generation**: Uses `typia.llm.application<T>()` to automatically generate JSON schemas from TypeScript interfaces. The LLM receives a schema describing the exact structure of the expected output, which it must conform to.

### Facade Pattern

Instead of directly orchestrating the 5-phase pipeline, AutoBE exposes a facade that LLMs interact with through function calling.

**Facade Interface**: `packages/agent/src/context/IAutoBeFacadeApplication.ts`

```typescript
export interface IAutoBeFacadeApplication {
  /**
   * Analyze natural language requirements into structured documents.
   */
  analyze(): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Design Prisma database schema from analysis.
   */
  prisma(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Generate OpenAPI specification from Prisma schema.
   */
  interface(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Create E2E tests for all API endpoints.
   */
  test(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Implement NestJS API controllers and services.
   */
  realize(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
}
```

**How It Works**: The top-level AutoBE agent presents these five functions to the LLM through Claude's function calling. The LLM engages in conversation with the user, and when it determines action is needed (e.g., user wants to add authentication), it calls the appropriate function (e.g., `interface({ instruction: "Add JWT authentication endpoints" })`).

**Return Values**: Each function returns `IAutoBeFacadeApplicationResult` with `status` ("success" | "failure" | "pending") and a `description` explaining what happened. The LLM uses these return values to inform the user about progress or errors.

**Location**: `packages/agent/src/factory/createAutoBeApplication.ts:28-111` implements these facade functions by calling the corresponding orchestrators internally.

**Example Flow**:
1. User: "I need a blog API with posts and comments"
2. LLM analyzes intent, calls `analyze()`
3. Analyze orchestrator generates requirements document, returns success
4. LLM reports to user: "I've analyzed your requirements and identified 2 main resources: Post and Comment"
5. User: "Great, let's proceed"
6. LLM calls `prisma({ instruction: "Create schema for blog with posts and comments" })`
7. Prisma orchestrator generates schema, validates with compiler, returns success
8. Process continues through remaining phases

## Performance and Optimization

AutoBE employs several optimization techniques to minimize latency and cost.

### Prompt Caching

Claude's prompt caching allows reusing expensive prompt processing across multiple requests. AutoBE strategically structures prompts to maximize cache hits.

**Batch Processing**: `packages/agent/src/utils/executeCachedBatch.ts`

When generating multiple similar items (e.g., 40 API operations), the first request includes the full system prompt and context (expensive). Subsequent requests reuse the cached prompt (cheap), only sending the operation-specific details.

```typescript
export const executeCachedBatch = async <T>(
  tasks: Array<(cacheKey?: string) => Promise<T>>,
  promptCacheKey?: string,
): Promise<T[]> => {
  // First task generates cache
  const first = await tasks[0]!(promptCacheKey);

  // Remaining tasks reuse cache in parallel
  const tail = await Promise.all(
    tasks.slice(1).map(task => task(promptCacheKey))
  );

  return [first, ...tail];
};
```

**Cache Invalidation**: When context changes (e.g., Prisma schema is modified), a new cache key is generated to ensure the LLM receives updated information.

### Concurrency Control

**Compilation Semaphore**: `packages/agent/src/factory/createAutoBeContext.ts:74-91`

TypeScript compilation is CPU-intensive. Running 40 compilations in parallel would overwhelm the system. A semaphore limits concurrent compilations to 2, balancing throughput with resource usage.

```typescript
const critical: Semaphore = new Semaphore(2);  // Max 2 concurrent

compiler: async () => {
  const compiler = await props.compiler();
  return getCriticalCompiler(critical, compiler);  // Wrapped with semaphore
}
```

**Parallel Generation**: Non-compilation tasks (like LLM requests for generating multiple operations) run in parallel without limits, maximizing throughput when CPU is not the bottleneck.

### Token Usage Tracking

**Implementation**: `packages/agent/src/AutoBeAgent.ts:183-207`

AutoBE tracks token usage across all LLM interactions, providing detailed breakdowns by phase and operation type. This enables cost analysis and optimization.

```typescript
// Incremental token counting
const previous = this.agentica_.getTokenUsage().toJSON().aggregate;
const increment = () => {
  const current = this.agentica_.getTokenUsage().toJSON().aggregate;
  this.usage_.facade.increment({
    total: current.total - previous.total,
    input: { tokens: current.input.tokens - previous.input.tokens, ... },
    output: { tokens: current.output.tokens - previous.output.tokens, ... },
  });
  previous = current;
};
```

## Reliability and Error Handling

### Self-Healing Compilation Loop

The core reliability mechanism is the Write → Validate → Correct loop that runs until compilation succeeds.

**Pattern**: Every code generation phase follows this flow:
1. Write agent generates code using LLM
2. Compiler validates the generated code
3. If compilation fails, Correct agent analyzes errors and regenerates
4. Repeat step 2-3 until compilation succeeds or max retries (typically 2) reached

**Example - Realize Phase**: `packages/agent/src/orchestrate/realize/orchestrateRealize.ts:88-106`

```typescript
let bucket = await process(scenarios);

for (let i = 0; i < 2; i++) {
  if (bucket.validate.result.type !== "failure") break;

  // Extract failed scenarios
  const failed = extractFailures(bucket.validate.result);

  // Re-correct and re-validate only failed parts
  bucket = await process(failed);
}
```

**Partial Success Handling**: If 40 APIs are generated and 38 succeed but 2 fail compilation, only the 2 failed APIs are regenerated. Successful code is preserved.

### Retry with Exponential Backoff

**Implementation**: `packages/agent/src/utils/backoffRetry.ts`

LLM API calls can fail due to rate limits, network issues, or temporary outages. AutoBE retries with exponential backoff plus jitter:

```typescript
const delay = Math.min(
  baseDelay * (2 ** retryCount),
  maxDelay
) * (1 + Math.random() * jitter);
```

**Error Classification**:
- **No Retry**: `insufficient_quota` errors (permanent)
- **Retry with backoff**: 5xx errors, 429 rate limits, network timeouts, connection resets
- **Immediate retry**: JSON parse failures with specific patterns

### Error Recovery Strategies

**Graceful Degradation**: When a phase fails after max retries, AutoBE reports the error clearly but preserves all previous successful work. Users can modify requirements and retry from the failed phase without losing progress.

**State Preservation**: All events are logged, enabling replay and debugging. If the system crashes mid-generation, event logs can reconstruct state up to the failure point.

## Summary

AutoBE's architecture is a sophisticated combination of:

- **Event-Driven Waterfall + Spiral**: Sequential phases with internal iteration loops
- **Three-Tier Compilation**: Progressive validation from AST to generated code to TypeScript
- **Agentica Integration**: Function calling facade hiding LLM complexity
- **Type-Safe Contracts**: `@autobe/interface` types enforced across all layers
- **Self-Healing Mechanisms**: Automatic error correction through compiler feedback
- **Performance Optimization**: Prompt caching, batching, concurrency control

The result is a system that reliably transforms conversations into production-ready backend applications with guaranteed compilation and comprehensive quality assurance.
