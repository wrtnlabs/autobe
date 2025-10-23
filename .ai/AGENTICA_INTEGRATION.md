# Agentica Integration

## What is Agentica

Agentica (`@agentica/core`) is a function-calling framework that abstracts interactions with multiple LLM providers (Claude, GPT-4, Gemini) behind a unified interface. It enables agents to expose TypeScript functions with JSON schemas, and the LLM autonomously decides which functions to call based on conversation context.

**Key Concepts**:
- **Function Calling**: LLMs can invoke predefined functions with structured arguments
- **Schema Generation**: TypeScript types automatically convert to JSON schemas
- **Multi-Provider**: Same code works with Claude, GPT-4, Gemini, etc.
- **Type Safety**: Full TypeScript type checking for function parameters and returns

## Why AutoBE Uses Agentica

AutoBE doesn't directly prompt LLMs with system messages and user queries. Instead, it leverages Agentica's function calling to create a **conversational API** where the LLM decides when and how to generate backend components.

**Benefits**:
1. **Abstraction**: No need to handle provider-specific APIs (Claude vs GPT-4 have different interfaces)
2. **Structured Output**: Function calling guarantees JSON schema compliance
3. **Intent Recognition**: LLM maps user intent to specific functions automatically
4. **Retry Logic**: Built-in handling of schema validation failures
5. **Token Tracking**: Automatic usage monitoring across all calls

## MicroAgentica Pattern

AutoBE uses **MicroAgentica** - lightweight, single-purpose agents created for specific tasks.

### What is MicroAgentica

A MicroAgentica instance is a disposable agent with:
- A specific LLM model configuration
- A single function calling schema
- A conversation history
- Enforcement of function calling (agent *must* call a function, not free-form response)

**Location**: `packages/agent/src/factory/createAutoBeContext.ts:103-203`

```typescript
conversate: async <T, P>(props: IConversateProps<T, P>) => {
  // Create a new MicroAgentica for this specific task
  const micro = new MicroAgentica<T, P>({
    model: props.controller.model,
    application: props.controller.application,
  });

  // Run conversation with history
  const { result, tokenUsage } = await micro.converse({
    histories: props.histories,
    enforceFunctionCall: props.enforceFunctionCall ?? false,
  });

  return { result, tokenUsage };
}
```

### Why MicroAgentica Instead of Persistent Agents

**Short-Lived**: Each orchestrator creates a fresh MicroAgentica, uses it for one task, then discards it. No state is carried between tasks.

**Advantages**:
1. **Isolation**: Each task has clean history without pollution from previous tasks
2. **Specialization**: Schema is tailored exactly to the current task
3. **Simplicity**: No complex agent lifecycle management
4. **Testability**: Easy to test individual tasks in isolation

**Example**: When generating 40 API operations, 40 MicroAgentica instances are created - one per operation. Each sees only the context relevant to its operation, improving focus and output quality.

## Controller Pattern

AutoBE defines **controllers** that specify the function calling schema for each task.

### Controller Structure

**Location**: `packages/agent/src/orchestrate/analyze/structures/IAutoBeAnalyzeWriteApplication.ts`

```typescript
export interface IAutoBeAnalyzeWriteApplication {
  /**
   * Write a requirements analysis document section.
   */
  write(props: {
    title: string;
    content: string;
  }): void;
}
```

This TypeScript interface becomes a JSON schema through `typia.llm.application<T>()`:

```typescript
const application = typia.llm.application<IAutoBeAnalyzeWriteApplication>();
```

The generated schema describes:
- Function name: `"write"`
- Parameters: `{ title: string, content: string }`
- Required fields, types, descriptions

### Creating Controllers

**Location**: Throughout `packages/agent/src/orchestrate/*/structures/`

Each orchestrator defines its controller interface:

```typescript
import { createController } from "somewhere";

const controller = createController({
  model: ctx.model,
  pointer: IPointer<IAutoBeAnalyzeWriteApplication>
});
```

The controller specifies:
- **Model**: Which LLM to use (claude-3-5-sonnet, gpt-4, etc.)
- **Application**: The TypeScript interface defining callable functions
- **Pointer**: Where to store the result when function is called

## IPointer Pattern

AutoBE uses `IPointer<T>` - a mutable reference for capturing function call results.

### What is IPointer

```typescript
export interface IPointer<T> {
  value: T | undefined;
}
```

A simple container that starts with `undefined` and gets filled when the LLM calls a function.

### Why IPointer

**Problem**: Agentica's function calling is async and event-driven. How do we capture the result?

**Solution**: Pass a pointer to the controller. When the LLM calls the function, Agentica writes the result to `pointer.value`.

**Location**: `packages/agent/src/orchestrate/analyze/orchestrateAnalyzeWrite.ts:31-48`

```typescript
const pointer: IPointer<IAutoBeAnalyzeWriteApplication> = { value: undefined };

const controller = createController({
  model: ctx.model,
  pointer: pointer,  // Result will be written here
});

const { tokenUsage } = await ctx.conversate({
  controller: controller,
  histories: [...transformedHistories],
  enforceFunctionCall: true,  // MUST call function
});

// After conversate() completes, pointer.value contains the result
const result = pointer.value!;  // Non-null assertion - enforced by enforceFunctionCall
```

### IPointer vs Return Values

Agentica functions are defined with `void` return type:

```typescript
interface MyController {
  generate(props: { ... }): void;  // NOT Promise<Result>
}
```

This is because the LLM doesn't "return" values in a traditional sense. Instead, calling the function is the result. IPointer captures this side effect as a value.

## Enforced Function Calling

### enforceFunctionCall: true

This critical flag ensures the LLM **must** call a function and cannot respond with plain text.

**Location**: `packages/agent/src/factory/createAutoBeContext.ts:182`

```typescript
await micro.converse({
  histories: props.histories,
  enforceFunctionCall: props.enforceFunctionCall ?? false,
});
```

**When true**:
- LLM must call one of the exposed functions
- Plain text responses are rejected
- Guarantees structured output

**When false**:
- LLM can choose to respond with text or call a function
- Used for conversational phases (e.g., facade-level where LLM talks to user)

**Best Practice**: Set `true` for all code generation tasks. Set `false` for user-facing conversation.

## History Transformation

Before creating a MicroAgentica, histories must be transformed into the format Agentica expects.

### AutoBE History → Agentica History

**Location**: `packages/agent/src/factory/createAgenticaHistory.ts`

```typescript
export const createAgenticaHistory = (
  history: AutoBeHistory
): IAgenticaHistoryJson => {
  if (history.type === "userMessage") {
    return {
      role: "user",
      content: history.content,
    };
  } else if (history.type === "assistantMessage") {
    return {
      role: "assistant",
      content: history.content,
    };
  }
  // ... handle other history types
};
```

**Why Transformation Needed**: AutoBE's history types are domain-specific (e.g., `AutoBeAnalyzeHistory`), but Agentica expects standard chat format (`role: "user" | "assistant" | "system"`).

### Orchestrator-Specific Histories

Each orchestrator has a dedicated history transformer that selects relevant context:

**Location**: `packages/agent/src/orchestrate/analyze/histories/transformAnalyzeWriteHistories.ts`

```typescript
export const transformAnalyzeWriteHistories = (
  state: AutoBeState
): Array<IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IUserMessage> => {
  return [
    {
      role: "system",
      content: AutoBeSystemPromptConstant.ANALYZE_WRITE,
    },
    {
      role: "user",
      content: `Write the analysis document for: ${documentTitle}`
    }
  ];
};
```

**Pattern**: Transformers include:
1. System prompt (defines agent role and instructions)
2. Relevant context (Prisma schema, analysis documents, etc.)
3. Specific task (what to generate now)

## Function Calling Flow

### Complete Example: Analyze Write

**Step 1 - Define Controller Interface**:

```typescript
// packages/agent/src/orchestrate/analyze/structures/IAutoBeAnalyzeWriteApplication.ts
export interface IAutoBeAnalyzeWriteApplication {
  write(props: {
    title: string;
    content: string;
  }): void;
}
```

**Step 2 - Create Pointer and Controller**:

```typescript
const pointer: IPointer<IAutoBeAnalyzeWriteApplication> = { value: undefined };

const controller = {
  model: ctx.model,
  application: typia.llm.application<IAutoBeAnalyzeWriteApplication>(),
  pointer: pointer,
};
```

**Step 3 - Transform Histories**:

```typescript
const histories = transformAnalyzeWriteHistories(ctx.state());
// Returns [
//   { role: "system", content: "You are an analysis expert..." },
//   { role: "user", content: "Write analysis for..." }
// ]
```

**Step 4 - Create MicroAgentica and Converse**:

```typescript
const micro = new MicroAgentica({
  model: controller.model,
  application: controller.application,
});

const { tokenUsage } = await micro.converse({
  histories: histories,
  enforceFunctionCall: true,
});
```

**Step 5 - Extract Result from Pointer**:

```typescript
const result = pointer.value!;
console.log(result.title);    // "Requirements Analysis"
console.log(result.content);  // "# Requirements\n\n..."
```

### What Happens Internally

1. **Schema Generation**: `typia.llm.application<T>()` analyzes the TypeScript interface and generates JSON schema
2. **Agentica Request**: MicroAgentica sends the schema + histories to LLM (Claude/GPT)
3. **LLM Response**: LLM returns JSON matching the schema: `{ function: "write", arguments: { title: "...", content: "..." } }`
4. **Schema Validation**: Agentica validates response against schema
5. **Pointer Assignment**: Agentica writes `arguments` to `pointer.value`
6. **Return**: Control returns to orchestrator with result in pointer

## Multi-Provider Support

### Model Configuration

**Location**: `packages/agent/src/context/IAutoBeFacadeApplicationProps.ts`

```typescript
export interface IAutoBeFacadeApplicationProps {
  model: IAgenticaModel;  // Can be Claude, GPT-4, Gemini, etc.
}
```

**Example Models**:
```typescript
// Claude
const model: IAgenticaModel = {
  provider: "anthropic",
  name: "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY,
};

// GPT-4
const model: IAgenticaModel = {
  provider: "openai",
  name: "gpt-4-turbo",
  apiKey: process.env.OPENAI_API_KEY,
};
```

**Provider Abstraction**: Orchestrators never know which provider is being used. They just call `ctx.conversate()` and Agentica handles provider-specific details.

### Provider-Specific Schema Generation

Agentica adapts schema format to each provider:

- **Claude**: Uses Claude's function calling format
- **OpenAI**: Uses OpenAI's tools format
- **Gemini**: Uses Gemini's function declaration format

AutoBE code remains identical across providers. Only the model configuration changes.

## Token Usage Tracking

### Automatic Tracking

Every `conversate()` call returns token usage:

```typescript
const { result, tokenUsage } = await ctx.conversate({...});

console.log(tokenUsage.input);    // Input tokens
console.log(tokenUsage.output);   // Output tokens
console.log(tokenUsage.cached);   // Cached tokens (if using prompt caching)
```

### Aggregation

**Location**: `packages/agent/src/AutoBeAgent.ts:183-207`

AutoBE aggregates token usage across all phases:

```typescript
// Track usage per phase
this.usage_.analyze.increment(tokenUsage);
this.usage_.prisma.increment(tokenUsage);
// etc.

// Total usage
const total = this.usage_.getTotal();
console.log(`Total tokens: ${total.input + total.output}`);
```

## Error Handling

### Schema Validation Failures

If LLM returns malformed JSON, Agentica retries automatically:

1. LLM returns invalid JSON
2. Agentica validates against schema → fails
3. Agentica sends error feedback to LLM
4. LLM tries again with corrected JSON
5. Repeat up to max retries (default: 3)

### API Errors

**Location**: `packages/agent/src/utils/backoffRetry.ts`

LLM API errors trigger exponential backoff retry:

```typescript
await backoffRetry(async () => {
  return await ctx.conversate({...});
});
```

Retries on:
- Network timeouts
- 429 rate limits
- 5xx server errors

Does not retry on:
- 400 bad request
- 401 unauthorized
- `insufficient_quota`

## Prompt Caching Integration

### Cache Key Parameter

```typescript
await ctx.conversate({
  controller: controller,
  histories: histories,
  promptCacheKey: "analyze-batch-1",  // Enables caching
});
```

**How It Works**:
1. First call with `promptCacheKey: "analyze-batch-1"` generates cache
2. Subsequent calls with same key reuse cached prompt
3. Only the final user message is sent (cheap)
4. Massive token savings for repetitive tasks

**Location**: `packages/agent/src/utils/executeCachedBatch.ts`

Batch processing automatically manages cache keys:

```typescript
const results = await executeCachedBatch(
  tasks.map(task => (cacheKey) => task(cacheKey)),
  "operation-batch"
);
```

## Best Practices

### 1. One MicroAgentica Per Task

**Do**:
```typescript
for (const operation of operations) {
  const result = await ctx.conversate({  // Creates new MicroAgentica
    controller: createController({ model, pointer }),
    histories: transform(operation),
  });
}
```

**Don't**:
```typescript
const agent = new MicroAgentica({...});  // Reusing across tasks
for (const operation of operations) {
  await agent.converse({...});  // Pollutes history
}
```

### 2. Always Use IPointer for Code Generation

**Do**:
```typescript
const pointer: IPointer<IMyController> = { value: undefined };
await ctx.conversate({ controller: { pointer, ... } });
const result = pointer.value!;
```

**Don't**:
```typescript
let result;
await ctx.conversate({...});
result = ???;  // How to get result?
```

### 3. Enforce Function Calling for Structured Output

**Do**:
```typescript
await ctx.conversate({
  enforceFunctionCall: true,  // Must call function
});
```

**Don't**:
```typescript
await ctx.conversate({
  enforceFunctionCall: false,  // Might just chat
});
```

### 4. Transform Histories Appropriately

**Do**:
```typescript
const histories = transformSpecificHistories(state);
// Returns only relevant context for this task
```

**Don't**:
```typescript
const histories = [...allHistories];  // Too much context
```

### 5. Use Prompt Caching for Batch Tasks

**Do**:
```typescript
await executeCachedBatch(tasks, "batch-key");
```

**Don't**:
```typescript
for (const task of tasks) {
  await task();  // No caching - expensive!
}
```

## Summary

Agentica integration is central to AutoBE's architecture:

- **Abstraction**: Hides provider differences behind unified interface
- **MicroAgentica**: Disposable agents for focused tasks
- **Function Calling**: Structured output through TypeScript interfaces
- **IPointer Pattern**: Captures async function call results
- **Type Safety**: Full compile-time checking of schemas
- **Prompt Caching**: Integrated for cost optimization

This design enables AutoBE to work with any LLM provider while maintaining clean, testable orchestration code.
