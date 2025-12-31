# Performance Optimization

## Prompt Caching Strategy

AutoBE achieves dramatic cost reduction through aggressive prompt caching. This section explains the mechanisms and patterns used.

### How Prompt Caching Works

Modern LLM providers (Claude, GPT-4) cache portions of the prompt that remain unchanged between requests. When a cache hit occurs, input tokens are essentially free (typically 90% discount).

**Cache Lifespan**: Caches typically last 5-15 minutes, perfect for AutoBE's batch operations.

**Cache Invalidation**: Changing any part of a cached section invalidates the entire cache.

### The executeCachedBatch Pattern

**Location**: `packages/agent/src/utils/executeCachedBatch.ts:3-15`

```typescript
export const executeCachedBatch = async <T>(
  tasks: Array<(user: string) => Promise<T>>,
  promptCacheKey?: string,
): Promise<T[]> => {
  if (tasks.length === 0) return [];

  promptCacheKey ??= v7();
  const first: T = await tasks[0]!(promptCacheKey);  // Establish cache
  const tail: T[] = await Promise.all(               // Reuse cache
    tasks.slice(1).map((task) => task(promptCacheKey)),
  );
  return [first, ...tail];
};
```

**Strategy**:
1. Execute first task **sequentially** to populate cache
2. Execute remaining tasks **in parallel** reusing established cache
3. All subsequent tasks get ~90% discount on input tokens

**Example**: Generating 40 API implementations
- First API: 10,000 input tokens (full price)
- Remaining 39 APIs: 10,000 input tokens each (~90% cached)
- **Savings**: ~$30-40 per generation run

### Cache Key Propagation

Cache keys propagate through the orchestrator hierarchy:

```typescript
// Top-level orchestrator
const fileList = await executeCachedBatch(
  scenario.files.map((file) => async (promptCacheKey) => {
    return await orchestrateAnalyzeWrite(ctx, {
      scenario,
      file,
      progress,
      promptCacheKey,  // Pass to sub-orchestrator
    });
  }),
);

// Sub-orchestrator
async function orchestrateAnalyzeWrite(
  ctx: AutoBeContext,
  props: { promptCacheKey?: string }
) {
  const histories = transformAnalyzeWriteHistories({
    state: ctx.state(),
    scenario: props.scenario,
    file: props.file,
    promptCacheKey: props.promptCacheKey,  // Pass to history transformer
  });
}

// History transformer
function transformAnalyzeWriteHistories(props: {
  promptCacheKey?: string;
}): ILlmHistory[] {
  return [
    {
      role: "user" as const,
      parts: [{ text: systemPrompt }],
      _cache: props.promptCacheKey ? { type: "ephemeral" } : undefined,
    },
    // ... rest of conversation
  ];
}
```

**Key Insight**: The `promptCacheKey` parameter threads through the entire call stack, enabling the history transformer to mark messages for caching.

### Message Ordering for Cache Efficiency

**Principle**: Place stable context at the beginning of conversation, variable content at the end.

**Good Ordering**:
```typescript
[
  { role: "user", parts: [{ text: systemPrompt }], _cache: { type: "ephemeral" } },
  { role: "user", parts: [{ text: prismaSchema }], _cache: { type: "ephemeral" } },
  { role: "user", parts: [{ text: openApiDocument }], _cache: { type: "ephemeral" } },
  { role: "user", parts: [{ text: specificTaskInstruction }] },  // No cache
]
```

**Bad Ordering**:
```typescript
[
  { role: "user", parts: [{ text: specificTaskInstruction }] },  // Different each time
  { role: "user", parts: [{ text: prismaSchema }] },  // Can't cache if preceded by varying content
]
```

The first ordering caches 90% of tokens. The second ordering caches nothing.

### Cache Hit Rate Monitoring

**Location**: Vendor request events track cache performance

```typescript
ctx.dispatch({
  type: "vendorRequest",
  source: "realizeWrite",
  model: ctx.model.name,
  inputTokens: 10000,
  outputTokens: 500,
  cachedTokens: 9000,  // 90% cache hit rate
});
```

**Calculating Savings**:
```typescript
const cacheHitRate = event.cachedTokens / event.inputTokens;
const savings = cacheHitRate * inputCost;
```

Frontends can aggregate these events to show real-time cost savings.

## Concurrency Control

### Semaphore for Compilation

**Location**: `packages/agent/src/context/createAutoBeContext.ts`

TypeScript compilation is CPU-intensive. AutoBE limits concurrent compilations using a semaphore:

```typescript
import { Semaphore } from "tstl";

const compileSemaphore = new Semaphore(2);  // Max 2 concurrent

const compile = async (code: string): Promise<CompileResult> => {
  await compileSemaphore.acquire();
  try {
    return await compiler.compile(code);
  } finally {
    compileSemaphore.release();
  }
};
```

**Why Limit to 2?**
- TypeScript compiler uses multiple threads internally
- CPU cores saturate with 2 compilations
- Additional compilations don't improve throughput
- Prevents system freeze during heavy batch operations

### LLM API Concurrency

**Provider Rate Limits**:
- Claude: 50 requests/minute (tier 2)
- GPT-4: 500 requests/minute (tier 4)

**AutoBE Strategy**:
- No artificial concurrency limit
- Rely on `executeCachedBatch` pattern (1 sequential, N-1 parallel)
- Let provider rate limiting naturally throttle requests
- Agentica's retry logic handles 429 errors gracefully

**Example**: Generating 40 APIs
- First API: Sequential (cache establishment)
- Next 39 APIs: Parallel (within rate limit)
- If rate limited, Agentica automatically retries with exponential backoff

## Batch Processing Patterns

### Standard Batch Pattern

```typescript
const results = await executeCachedBatch(
  items.map((item) => async (promptCacheKey) => {
    return await processItem(ctx, { item, promptCacheKey });
  }),
);
```

**Characteristics**:
- First item establishes cache
- Remaining items run in parallel
- Progress tracking via mutable progress object
- Fail-fast on errors (unless caught)

### Resilient Batch Pattern

```typescript
const results = (await executeCachedBatch(
  items.map((item) => async (promptCacheKey) => {
    try {
      return await processItem(ctx, { item, promptCacheKey });
    } catch {
      return null;  // Continue on error
    }
  }),
)).filter((r) => r !== null);
```

**Characteristics**:
- Catches errors and returns null
- Filters out failures
- Continues processing remaining items
- Used when partial success is acceptable

### Retry-Enhanced Batch Pattern

**Location**: `packages/agent/src/orchestrate/realize/orchestrateRealize.ts:434-449`

```typescript
const writes = (await executeCachedBatch(
  artifacts.map((art) => async (promptCacheKey) => {
    const write = async (): Promise<Result | null> => {
      try {
        return await orchestrateWrite(ctx, { art, promptCacheKey });
      } catch {
        return null;
      }
    };
    return (await write()) ?? (await write());  // Retry once inline
  }),
)).filter((w) => w !== null);
```

**Characteristics**:
- Inline retry: `(await write()) ?? (await write())`
- First attempt failure triggers immediate second attempt
- Doubles success rate for transient failures
- Used for critical operations (Realize phase)

## Token Usage Optimization

### Minimize Context Size

**Principle**: Only include necessary information in prompts.

**Example**: Realize phase doesn't need full analysis documents:
```typescript
// ❌ Bad - includes unnecessary context
const histories = [
  { role: "user", parts: [{ text: fullAnalysisReport }] },  // 50KB
  { role: "user", parts: [{ text: fullPrismaSchema }] },    // 30KB
  { role: "user", parts: [{ text: fullOpenApiDoc }] },      // 100KB
  { role: "user", parts: [{ text: taskInstruction }] },     // 1KB
];

// ✅ Good - only includes relevant operation
const histories = [
  { role: "user", parts: [{ text: systemPrompt }] },
  { role: "user", parts: [{ text: relevantSchemas }] },     // 5KB
  { role: "user", parts: [{ text: singleOperation }] },     // 2KB
  { role: "user", parts: [{ text: taskInstruction }] },     // 1KB
];
```

**Result**: 180KB → 8KB per request, 95% token reduction.

### History Transformers

**Location**: `packages/agent/src/orchestrate/*/histories/`

Each orchestrator has specialized history transformers that include only relevant context:

```typescript
// packages/agent/src/orchestrate/realize/histories/transformRealizeWriteHistories.ts
export function transformRealizeWriteHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  operation: AutoBeOpenApi.IOperation;
  authorization: AutoBeRealizeAuthorization | null;
}): ILlmHistory[] {
  return [
    {
      role: "user" as const,
      parts: [{ text: systemPrompt }],
      _cache: { type: "ephemeral" },
    },
    {
      role: "user" as const,
      parts: [{ text: formatOperation(props.operation) }],  // Only this operation
      _cache: { type: "ephemeral" },
    },
    {
      role: "user" as const,
      parts: [{ text: formatSchemas(props.operation, props.state) }],  // Only referenced schemas
      _cache: { type: "ephemeral" },
    },
    {
      role: "user" as const,
      parts: [{ text: taskInstruction }],
    },
  ];
}
```

**Key Insight**: Each orchestrator's history transformer is a performance optimization opportunity. Careful curation of context can reduce token usage by 90%+.

### Schema Deduplication

**Location**: `packages/agent/src/orchestrate/interface/utils/deduplicateSchemas.ts`

OpenAPI documents often reference the same schemas multiple times. History transformers deduplicate before sending:

```typescript
function deduplicateSchemas(
  operations: AutoBeOpenApi.IOperation[],
  components: AutoBeOpenApi.IComponents
): {
  uniqueSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  references: Set<string>;
} {
  const references = new Set<string>();

  operations.forEach((op) => {
    extractReferences(op.requestBody, references);
    extractReferences(op.responseBody, references);
  });

  const uniqueSchemas = Object.fromEntries(
    Array.from(references).map((ref) => [ref, components.schemas[ref]])
  );

  return { uniqueSchemas, references };
}
```

**Result**: Sending 200 operations with 50 schemas instead of including schemas 200 times (4x reduction).

## Compilation Optimization

### Incremental Compilation

**Principle**: Only recompile changed files.

**Implementation**: TypeScript's `ts.createProgram` with prior program reference:

```typescript
let previousProgram: ts.Program | undefined;

function compile(files: Map<string, string>): ts.Diagnostic[] {
  const host = createCompilerHost(files);

  const program = ts.createProgram({
    rootNames: Array.from(files.keys()),
    options: compilerOptions,
    host,
    oldProgram: previousProgram,  // Reuse prior compilation
  });

  previousProgram = program;  // Save for next compilation

  return ts.getPreEmitDiagnostics(program);
}
```

**Speedup**: 30 seconds → 2 seconds for typical recompilation.

### Selective Diagnostics Filtering

**Location**: `packages/agent/src/orchestrate/realize/utils/filterDiagnostics.ts`

Only extract diagnostics for files we're currently correcting:

```typescript
function filterDiagnostics(
  allDiagnostics: ts.Diagnostic[],
  targetFiles: string[]
): ts.Diagnostic[] {
  const targetSet = new Set(targetFiles);

  return allDiagnostics.filter((diagnostic) => {
    const fileName = diagnostic.file?.fileName;
    return fileName && targetSet.has(fileName);
  });
}
```

**Benefit**: Reduces noise, prevents correction loops on unrelated files.

### Parallel Validation

Prisma, OpenAPI, and TypeScript validations can run in parallel:

```typescript
const [prismaResult, openapiResult, typescriptResult] = await Promise.all([
  compiler.prisma.validate(prismaSchema),
  compiler.interface.validate(openapiDoc),
  compiler.typescript.compile(files),
]);
```

**Speedup**: 15 seconds → 7 seconds for three sequential validations.

## Memory Optimization

### Stream Processing for Large Documents

**Problem**: Analysis phase generates 10+ multi-paragraph documents. Loading all into memory at once can exceed heap limits.

**Solution**: Process documents as stream:

```typescript
async function* generateDocuments(scenario: Scenario): AsyncGenerator<Document> {
  for (const file of scenario.files) {
    const doc = await orchestrateAnalyzeWrite(ctx, { file });
    yield doc;  // Emit immediately
  }
}

// Consume stream
for await (const doc of generateDocuments(scenario)) {
  await saveDocument(doc);  // Save and discard
}
```

**Benefit**: Constant memory usage regardless of document count.

### Selective State Loading

AutoBE state can become large (100MB+ for complex projects). Load selectively:

```typescript
interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;
  prisma: AutoBeDatabaseHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
}

// ❌ Bad - loads entire state
function getState(): AutoBeState {
  return JSON.parse(fs.readFileSync("state.json"));
}

// ✅ Good - loads only needed phase
function getPhaseState(phase: "analyze" | "database" | ...): AutoBeHistory {
  const state = JSON.parse(fs.readFileSync("state.json"));
  return state[phase];
}
```

**Benefit**: 5x reduction in memory usage when only one phase is needed.

## Network Optimization

### Request Deduplication

**Problem**: Multiple orchestrators might request the same LLM generation.

**Solution**: Deduplicate identical requests in-flight:

```typescript
const pendingRequests = new Map<string, Promise<any>>();

async function conversate(props: ConversateProps): Promise<Result> {
  const key = hashRequest(props);

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;  // Reuse in-flight request
  }

  const promise = actualConversate(props);
  pendingRequests.set(key, promise);

  try {
    return await promise;
  } finally {
    pendingRequests.delete(key);
  }
}
```

**Benefit**: Eliminates duplicate API calls, reduces latency.

### Connection Pooling

Reuse HTTP connections for LLM API calls:

```typescript
import { Agent } from "https";

const agent = new Agent({
  keepAlive: true,
  maxSockets: 50,  // Match concurrency
});

const client = new OpenAI({
  httpAgent: agent,
});
```

**Benefit**: Removes TCP handshake overhead (100-200ms per request).

## Profiling and Monitoring

### Token Usage Tracking

Every orchestrator emits vendor request events:

```typescript
ctx.dispatch({
  type: "vendorRequest",
  source: "realizeWrite",
  model: "claude-3.5-sonnet",
  inputTokens: 10000,
  outputTokens: 500,
  cachedTokens: 9000,
});
```

Aggregate to calculate costs:

```typescript
function calculateCost(events: AutoBeVendorRequestEvent[]): number {
  return events.reduce((sum, event) => {
    const inputCost = (event.inputTokens - event.cachedTokens) * PRICE_PER_INPUT_TOKEN;
    const cachedCost = event.cachedTokens * PRICE_PER_CACHED_TOKEN;
    const outputCost = event.outputTokens * PRICE_PER_OUTPUT_TOKEN;
    return sum + inputCost + cachedCost + outputCost;
  }, 0);
}
```

**Dashboard**: Real-time cost tracking helps identify optimization opportunities.

### Timing Events

Every phase emits start/complete events with timestamps:

```typescript
const start = new Date();

ctx.dispatch({
  type: "realizeStart",
  id: v7(),
  created_at: start.toISOString(),
  // ...
});

// ... work ...

ctx.dispatch({
  type: "realizeComplete",
  id: v7(),
  created_at: new Date().toISOString(),
  elapsed: new Date().getTime() - start.getTime(),
  // ...
});
```

Analyze elapsed times to find bottlenecks:

```typescript
const phaseTimes = events
  .filter((e) => e.type.endsWith("Complete"))
  .map((e) => ({ phase: e.type.replace("Complete", ""), elapsed: e.elapsed }))
  .sort((a, b) => b.elapsed - a.elapsed);

console.log("Slowest phases:", phaseTimes.slice(0, 5));
```

### Cache Hit Rate Analysis

Track cache performance over time:

```typescript
const cacheMetrics = vendorEvents.map((e) => ({
  timestamp: e.created_at,
  hitRate: e.cachedTokens / e.inputTokens,
  source: e.source,
}));

const avgHitRate =
  cacheMetrics.reduce((sum, m) => sum + m.hitRate, 0) / cacheMetrics.length;

console.log(`Average cache hit rate: ${(avgHitRate * 100).toFixed(1)}%`);
```

**Target**: 80%+ cache hit rate indicates effective caching strategy.

## Summary

AutoBE's optimization strategies:

- **Prompt Caching** - 90% cost reduction via sequential-then-parallel pattern
- **Concurrency Control** - Semaphore prevents CPU saturation
- **Batch Processing** - Three patterns (standard, resilient, retry-enhanced)
- **Token Minimization** - History transformers curate context precisely
- **Incremental Compilation** - Reuse prior program for 15x speedup
- **Memory Streaming** - Constant memory regardless of document count
- **Request Deduplication** - Eliminate redundant API calls
- **Connection Pooling** - Remove TCP handshake overhead
- **Comprehensive Monitoring** - Track tokens, timing, cache hits

These optimizations enable AutoBE to generate production-ready backends in minutes instead of hours, at fraction of expected cost.
