# Agent Orchestration

## Hierarchical Orchestration Pattern

AutoBE uses a **hierarchical orchestration** architecture where top-level orchestrators delegate work to specialized sub-orchestrators. This creates a tree of responsibility that mirrors the pipeline structure.

### Orchestration Hierarchy

**Location**: `packages/agent/src/orchestrate/`

```
orchestrateAnalyze
├─ orchestrateAnalyzeScenario
├─ orchestrateAnalyzeWrite (batched)
└─ orchestrateAnalyzeReview (batched)

orchestratePrisma
├─ orchestratePrismaScenario
├─ orchestratePrismaSchemas (batched)
├─ orchestratePrismaReview (batched)
└─ orchestratePrismaCorrect (self-healing loop)

orchestrateInterface
├─ orchestrateInterfaceEndpoints (batched)
├─ orchestrateInterfaceOperations (batched)
├─ orchestrateInterfaceSchemas (batched)
├─ orchestrateInterfaceSchemaReview (batched)
├─ orchestrateInterfaceAuthorizations (batched)
└─ orchestrateInterfacePrerequisites (batched)

orchestrateTest
├─ orchestrateTestScenario (batched)
├─ orchestrateTestWrite (batched)
└─ orchestrateTestCorrect (self-healing loop)

orchestrateRealize
├─ orchestrateRealizeAuthorization (batched)
├─ orchestrateRealizeWrite (batched)
├─ orchestrateRealizeCorrectCasting (self-healing)
└─ orchestrateRealizeCorrect (self-healing loop)
```

Each level has a specific responsibility. Top-level orchestrators manage lifecycle and state, while sub-orchestrators handle specific generation tasks.

## Batch Processing with Prompt Caching

### The executeCachedBatch Pattern

**Location**: `packages/agent/src/utils/executeCachedBatch.ts:3-15`

AutoBE implements a sophisticated batching strategy to maximize prompt caching:

```typescript
export const executeCachedBatch = async <T>(
  tasks: Array<(user: string) => Promise<T>>,
  promptCacheKey?: string,
): Promise<T[]> => {
  if (tasks.length === 0) return [];

  promptCacheKey ??= v7();
  const first: T = await tasks[0]!(promptCacheKey);  // Sequential: establish cache
  const tail: T[] = await Promise.all(               // Parallel: reuse cache
    tasks.slice(1).map((task) => task(promptCacheKey)),
  );
  return [first, ...tail];
};
```

**Key Insight**: The first task runs **sequentially** to establish the prompt cache, then all remaining tasks run **in parallel** reusing that cache. This pattern appears throughout AutoBE orchestrators.

### Batch Processing Example: Analyze Phase

**Location**: `packages/agent/src/orchestrate/analyze/orchestrateAnalyze.ts:40-86`

```typescript
export const orchestrateAnalyze = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
  // Initialize step counter
  const step: number = (ctx.state().analyze?.step ?? -1) + 1;

  ctx.dispatch({
    type: "analyzeStart",
    id: v7(),
    step,
    created_at: new Date().toISOString(),
  });

  // Generate scenario (single task)
  const scenario: AutoBeAnalyzeScenarioEvent = await orchestrateAnalyzeScenario(ctx);
  ctx.dispatch(scenario);

  // Batch write documents with prompt caching
  const writeProgress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };
  const fileList: AutoBeAnalyzeFile[] = await executeCachedBatch(
    scenario.files.map((file) => async (promptCacheKey) => {
      const event: AutoBeAnalyzeWriteEvent = await orchestrateAnalyzeWrite(
        ctx,
        {
          scenario,
          file,
          progress: writeProgress,
          promptCacheKey,  // Passed to history transformer
        },
      );
      return event.file;
    }),
  );

  // Batch review documents with prompt caching
  const reviewProgress: AutoBeProgressEventBase = {
    total: fileList.length,
    completed: 0,
  };
  const newFiles: AutoBeAnalyzeFile[] = await executeCachedBatch(
    fileList.map((file) => async (promptCacheKey) => {
      try {
        const event: AutoBeAnalyzeReviewEvent = await orchestrateAnalyzeReview(
          ctx,
          {
            scenario,
            allFiles: fileList,
            myFile: file,
            progress: reviewProgress,
            promptCacheKey,
          },
        );
        return { ...event.file, content: event.content };
      } catch {
        return file;  // Fallback on error
      }
    }),
  );

  // Complete with results
  return ctx.dispatch({
    type: "analyzeComplete",
    id: v7(),
    actors: scenario.actors,
    prefix: scenario.prefix,
    files: newFiles,
    step,
    elapsed: new Date().getTime() - startTime.getTime(),
    created_at: new Date().toISOString(),
  });
};
```

**Pattern Elements**:
1. **Step Counter Initialization** - Increments step to invalidate downstream state
2. **Event Emission** - Start event with step number
3. **Sequential Planning** - Single scenario generation establishes context
4. **Batch Execution** - Multiple writes/reviews with shared cache key
5. **Progress Tracking** - Mutable progress objects updated during batch
6. **Error Handling** - Try-catch with fallback to original on failure
7. **Complete Event** - Dispatches history with all results

## Self-Healing Loop Pattern

### Compiler-Driven Correction

AutoBE orchestrators implement **self-healing loops** that repeatedly correct errors until compilation succeeds or retry limit is reached.

**Location**: `packages/agent/src/orchestrate/realize/orchestrateRealizeCorrect.ts:32-124`

```typescript
export async function orchestrateRealizeCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeRealizeFunctionFailure[],
  progress: AutoBeProgressEventBase,
  life: number = ctx.retry,  // Default: 3 attempts
): Promise<AutoBeRealizeFunction[]> {
  // Compile all functions
  const event = await compileRealizeFiles(ctx, {
    authorizations,
    functions,
  });

  // Base case: compilation succeeded
  if (event.result.type !== "failure") return functions;

  // Base case: retry limit reached
  else if (life < 0) return functions;

  // Extract diagnostics
  const diagnostics = event.result.diagnostics;

  // Filter to provider files only
  if (
    event.result.diagnostics.every(
      (d) => !d.file?.startsWith("src/providers"),
    )
  ) {
    return functions;  // Non-provider errors, stop
  }

  // Group diagnostics by file location
  const locations: string[] = Array.from(
    new Set(
      diagnostics
        .map((d) => d.file)
        .filter((f): f is string => f !== null)
        .filter((f) => f.startsWith("src/providers")),
    ),
  );

  progress.total += locations.length;

  // Build failure records
  const diagnosticsByFile: Record<string, IAutoBeRealizeFunctionFailure> = {};
  diagnostics.forEach((diagnostic) => {
    const location: string | null = diagnostic.file;
    if (location === null) return;
    if (!location.startsWith("src/providers")) return;

    if (!diagnosticsByFile[location]) {
      const func: AutoBeRealizeFunction | undefined = functions.find(
        (f) => f.location === location,
      );
      if (func === undefined) return;

      diagnosticsByFile[location] = {
        function: func,
        diagnostics: [],
      };
    }
    diagnosticsByFile[location].diagnostics.push(diagnostic);
  });

  const newFailures: IAutoBeRealizeFunctionFailure[] = [
    ...failures,
    ...Object.values(diagnosticsByFile),
  ];

  // Batch correction with prompt caching
  const corrected: AutoBeRealizeFunction[] = await correct(
    ctx,
    locations,
    scenarios,
    authorizations,
    functions,
    filterDiagnostics(newFailures, functions.map((fn) => fn.location)),
    progress,
  );

  // Recursive call with decremented life counter
  return orchestrateRealizeCorrect(
    ctx,
    scenarios,
    authorizations,
    corrected,
    filterDiagnostics(newFailures, corrected.map((c) => c.location)),
    progress,
    life - 1,  // Decrement retry counter
  );
}
```

**Self-Healing Mechanism**:
1. **Compile** - Invoke TypeScript compiler
2. **Check Result** - If success, return; if no retries left, return
3. **Extract Diagnostics** - Group errors by file
4. **Correct in Batch** - Use LLM to fix each failed function
5. **Recurse** - Call self with corrected functions and decremented counter

This pattern ensures 100% compilation or exhausts all retry attempts.

### Correction with Function Calling

**Location**: `packages/agent/src/orchestrate/realize/orchestrateRealizeCorrect.ts:185-275`

```typescript
async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    function: AutoBeRealizeFunction;
    failures: IAutoBeRealizeFunctionFailure[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent | null> {
  const pointer: IPointer<IAutoBeRealizeCorrectApplication.IProps | null> = {
    value: null,
  };

  const dto = await getRealizeWriteDto(ctx, props.scenario.operation);
  const { tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    controller: createController({
      model: ctx.model,
      functionName: props.scenario.functionName,
      build: (next) => {
        pointer.value = next;  // IPointer captures function call result
      },
    }),
    histories: transformRealizeCorrectHistories({
      state: ctx.state(),
      scenario: props.scenario,
      authorization: props.authorization,
      code: props.function.content,  // Original failing code
      dto,
      failures: props.failures.filter(
        (f) => f.function.location === props.function.location,
      ),  // Compiler diagnostics
      totalAuthorizations: props.totalAuthorizations,
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Correct the TypeScript code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${getRealizeWriteCodeTemplate({
        scenario: props.scenario,
        schemas: ctx.state().interface!.document.components.schemas,
        operation: props.scenario.operation,
        authorization: props.authorization ?? null,
      })}

      Current code is as follows:
      \`\`\`typescript
      ${props.function.content}
      \`\`\`
    `,
  });

  if (pointer.value === null) {
    return null;  // Function call failed
  }

  // Post-process: fix import statements
  pointer.value.draft = await replaceImportStatements(ctx, {
    operation: props.scenario.operation,
    schemas: ctx.state().interface!.document.components.schemas,
    code: pointer.value.draft,
    decoratorType: props.authorization?.payload.name,
  });

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.revise.final ?? pointer.value.draft,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
}
```

**Key Elements**:
- **IPointer Pattern** - Mutable reference captures function call result
- **Transform Histories** - Includes failures (compiler diagnostics) in context
- **Enforce Function Call** - Forces LLM to call correction function
- **Template Context** - Shows both template and failing code
- **Import Fixing** - Post-processes to correct import paths
- **Event Emission** - Progress tracking with corrected code

## Realize Phase: Complex Orchestration

The Realize phase demonstrates the most complex orchestration pattern with multiple retry loops.

**Location**: `packages/agent/src/orchestrate/realize/orchestrateRealize.ts:27-200`

```typescript
export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    // STATE VALIDATION
    const document: AutoBeOpenApi.IDocument | undefined =
      ctx.state().interface?.document;
    if (document === undefined)
      throw new Error("Can't realize because operations are nothing.");

    const predicate: string | null = predicateStateMessage(
      ctx.state(),
      "realize",
    );
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,  // Returns prerequisite message
        completed_at: new Date().toISOString(),
      });

    ctx.dispatch({
      type: "realizeStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().test?.step ?? 0,
    });

    // PREPARE ASSETS
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);

    const writeProgress: AutoBeProgressEventBase = {
      total: document.operations.length,
      completed: 0,
    };
    const correctProgress: AutoBeProgressEventBase = {
      total: document.operations.length,
      completed: 0,
    };

    // NESTED PROCESSING FUNCTION
    const process = async (
      artifacts: IAutoBeRealizeScenarioResult[],
    ): Promise<IBucket> => {
      // 1. Batch write implementations
      const writes: AutoBeRealizeWriteEvent[] = (
        await executeCachedBatch(
          artifacts.map((art) => async (promptCacheKey) => {
            const write = async (): Promise<AutoBeRealizeWriteEvent | null> => {
              try {
                return await orchestrateRealizeWrite(ctx, {
                  totalAuthorizations: authorizations,
                  authorization: art.decoratorEvent ?? null,
                  scenario: art,
                  document,
                  progress: writeProgress,
                  promptCacheKey,
                });
              } catch {
                return null;
              }
            };
            return (await write()) ?? (await write());  // Retry once inline
          }),
        )
      ).filter((w) => w !== null);

      // 2. Deduplicate by location
      const functions: AutoBeRealizeFunction[] = Object.entries(
        Object.fromEntries(writes.map((w) => [w.location, w.content])),
      ).map(([location, content]) => {
        const scenario = artifacts.find((el) => el.location === location)!;
        return {
          location,
          content,
          endpoint: {
            method: scenario.operation.method,
            path: scenario.operation.path,
          },
          name: scenario.functionName,
        };
      });

      // 3. Self-healing correction loops
      const corrected: AutoBeRealizeFunction[] =
        await orchestrateRealizeCorrectCasting(
          ctx,
          artifacts,
          authorizations,
          functions,
          correctProgress,
        ).then(async (res) => {
          return await orchestrateRealizeCorrect(
            ctx,
            artifacts,
            authorizations,
            res,
            [],  // No prior failures
            correctProgress,
          );
        });

      // 4. Compile and validate
      const validate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
        ctx,
        {
          authorizations,
          functions: corrected,
        },
      );

      return { corrected, validate };
    };

    // MAIN PROCESSING LOOP
    const entireScenarios: IAutoBeRealizeScenarioResult[] =
      document.operations.map((operation) =>
        generateRealizeScenario(ctx, operation, authorizations),
      );

    let bucket: IBucket = await process(entireScenarios);

    // OUTER RETRY LOOP (max 2 additional attempts)
    for (let i: number = 0; i < 2; ++i) {
      if (bucket.validate.result.type !== "failure") break;

      // Find failed operations
      const failedScenarios: IAutoBeRealizeScenarioResult[] = Array.from(
        new Set(bucket.validate.result.diagnostics.map((f) => f.file)),
      )
        .map((location) =>
          bucket.corrected.find((f) => f.location === location),
        )
        .filter((f) => f !== undefined)
        .map((f) =>
          entireScenarios.find(
            (s) =>
              s.operation.path === f.endpoint.path &&
              s.operation.method === f.endpoint.method,
          ),
        )
        .filter((o) => o !== undefined);

      if (failedScenarios.length === 0) break;

      // Update progress totals
      writeProgress.total += failedScenarios.length;
      correctProgress.total += failedScenarios.length;

      // Reprocess failed scenarios
      const newBucket: IBucket = await process(failedScenarios);

      // Merge results
      const corrected: Map<string, AutoBeRealizeFunction> = new Map([
        ...bucket.corrected.map((f) => [f.location, f] as const),
        ...newBucket.corrected.map((f) => [f.location, f] as const),
      ]);

      bucket = {
        corrected: Array.from(corrected.values()),
        validate: newBucket.validate,
      };
    }

    // GENERATE CONTROLLERS
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: bucket.corrected,
        authorizations,
      });

    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      created_at: new Date().toISOString(),
      functions: bucket.corrected,
      authorizations,
      controllers,
      compiled: bucket.validate.result,
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };

interface IBucket {
  corrected: AutoBeRealizeFunction[];
  validate: AutoBeRealizeValidateEvent;
}
```

**Multi-Level Error Recovery**:
1. **Inner Retry** - Inline `(await write()) ?? (await write())` retries once immediately
2. **Correction Loop** - `orchestrateRealizeCorrect` recursively fixes compilation errors
3. **Outer Retry Loop** - Top-level for loop reprocesses failed operations up to 2 times
4. **Selective Reprocessing** - Only failed operations are regenerated, not all

This multi-tiered strategy maximizes success rate while minimizing token usage.

## Progress Tracking Integration

### Mutable Progress Objects

Orchestrators use mutable progress objects that sub-orchestrators update:

```typescript
const writeProgress: AutoBeProgressEventBase = {
  total: scenario.files.length,
  completed: 0,
};

const fileList = await executeCachedBatch(
  scenario.files.map((file) => async (promptCacheKey) => {
    const event = await orchestrateAnalyzeWrite(ctx, {
      scenario,
      file,
      progress: writeProgress,  // Passed by reference
      promptCacheKey,
    });
    return event.file;
  }),
);
```

Sub-orchestrators increment `progress.completed` and emit progress events:

```typescript
ctx.dispatch({
  type: "progress",
  source: "analyzeWrite",
  completed: ++props.progress.completed,
  total: props.progress.total,
});
```

This enables real-time progress tracking without explicit coordination.

## Compiler Integration

### Semaphore Pattern for Compilation

**Location**: `packages/agent/src/context/createAutoBeContext.ts`

AutoBE uses a semaphore to limit concurrent compilations:

```typescript
const compileSemaphore = new Semaphore(2);  // Max 2 concurrent compilations

const compile = async (...) => {
  await compileSemaphore.acquire();
  try {
    return await compiler.compile(...);
  } finally {
    compileSemaphore.release();
  }
};
```

This prevents resource exhaustion when multiple orchestrators invoke compilation in parallel.

### Compilation Feedback Loop

```
1. Generate Code
   ↓
2. Compile
   ↓
3. Extract Diagnostics ----+
   ↓                       |
4. If Errors:              |
   - Group by file         |
   - Create failure records|
   - Pass to correction    |
   - Regenerate code       |
   - Go to 2 --------------+
   ↓
5. Success
```

Orchestrators embed compiler diagnostics into history transformers, enabling the LLM to see exactly what went wrong and fix it.

## Event Emission Patterns

### Standard Event Flow

Every orchestrator follows a consistent event emission pattern:

```typescript
// 1. Start Event
ctx.dispatch({
  type: "phaseStart",
  id: v7(),
  step,
  created_at: new Date().toISOString(),
});

// 2. Planning Event (optional)
const scenario = await orchestratePlanning(ctx);
ctx.dispatch(scenario);  // e.g., analyzeScenario

// 3. Generation Events (batched)
await executeCachedBatch(
  items.map((item) => async (promptCacheKey) => {
    const event = await orchestrateGenerate(ctx, { item, promptCacheKey });
    ctx.dispatch(event);  // e.g., analyzeWrite
    return event.result;
  }),
);

// 4. Review Events (optional, batched)
await executeCachedBatch(
  items.map((item) => async (promptCacheKey) => {
    const event = await orchestrateReview(ctx, { item, promptCacheKey });
    ctx.dispatch(event);  // e.g., analyzeReview
    return event.result;
  }),
);

// 5. Correction Events (self-healing loop)
await orchestrateCorrect(ctx, items);  // Emits correctEvent

// 6. Complete Event
ctx.dispatch({
  type: "phaseComplete",
  id: v7(),
  step,
  results: [...],
  elapsed,
  created_at: new Date().toISOString(),
});
```

This consistency enables frontends to build generic event visualizers.

## Orchestration Best Practices

### 1. Always Use Step Counters

```typescript
const step: number = (ctx.state().previousPhase?.step ?? -1) + 1;
```

Step counters enable automatic downstream invalidation.

### 2. Batch with Prompt Caching

```typescript
await executeCachedBatch(
  items.map((item) => async (promptCacheKey) => {
    return await generate(ctx, { item, promptCacheKey });
  }),
);
```

First task establishes cache, rest reuse it.

### 3. Emit Events at Key Points

```typescript
ctx.dispatch(startEvent);
// ... work ...
ctx.dispatch(completeEvent);
```

Events enable progress tracking, debugging, and state reconstruction.

### 4. Use Self-Healing Loops

```typescript
const correct = async (life: number): Promise<Result> => {
  const result = await compile();
  if (result.success) return result;
  if (life < 0) return result;

  const fixed = await fix(result.errors);
  return correct(life - 1);
};
```

Recursion with retry limit ensures eventual termination.

### 5. Validate State Before Execution

```typescript
const predicate: string | null = predicateStateMessage(ctx.state(), "realize");
if (predicate !== null)
  return ctx.assistantMessage({ type: "assistantMessage", text: predicate });
```

Return assistant message explaining missing prerequisites.

## Summary

AutoBE's orchestration system provides:

- **Hierarchical Structure** - Top-level orchestrators delegate to specialized sub-orchestrators
- **Batch Optimization** - First task establishes prompt cache, rest run in parallel
- **Self-Healing** - Recursive correction loops with retry limits
- **Progress Tracking** - Mutable progress objects updated during batch execution
- **Compiler Integration** - Feedback loop with diagnostics passed to LLM
- **Event-Driven** - Consistent event emission enables observability
- **Multi-Level Retry** - Inline retry → correction loop → outer retry loop

This architecture enables AutoBE to generate complex applications with 100% compilation guarantee while optimizing for performance and cost.
