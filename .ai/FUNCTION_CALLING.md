# Function Calling

## Overview

AutoBE uses Claude's (and other LLMs') function calling capability to enable conversational backend generation. Instead of directly orchestrating phases, the LLM autonomously decides when to generate schemas, APIs, tests, or implementations based on user conversation.

**Key Insight**: The LLM is in control. It reads user messages, determines intent, and calls appropriate functions. AutoBE provides the functions; the LLM provides the intelligence to use them correctly.

## Facade Pattern

AutoBE exposes a **facade** - a simplified interface with five high-level functions representing the pipeline phases.

### Facade Interface

**Location**: `packages/agent/src/context/IAutoBeFacadeApplication.ts`

```typescript
export interface IAutoBeFacadeApplication {
  /**
   * Analyze requirements from natural language into structured documents.
   *
   * @returns Result indicating success/failure with description
   */
  analyze(): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Design Prisma database schema based on analyzed requirements.
   *
   * @param props.instruction - Additional instructions for schema generation
   * @returns Result indicating success/failure with description
   */
  prisma(props: {
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Generate OpenAPI specification from Prisma schema.
   *
   * @param props.instruction - Additional instructions for API design
   * @returns Result indicating success/failure with description
   */
  interface(props: {
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Create E2E test suite for all API endpoints.
   *
   * @param props.instruction - Additional instructions for test generation
   * @returns Result indicating success/failure with description
   */
  test(props: {
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;

  /**
   * Implement NestJS API controllers and services.
   *
   * @param props.instruction - Additional instructions for implementation
   * @returns Result indicating success/failure with description
   */
  realize(props: {
    instruction: string;
  }): Promise<IAutoBeFacadeApplicationResult>;
}
```

### Result Type

```typescript
export interface IAutoBeFacadeApplicationResult {
  /**
   * "success" - Phase completed successfully
   * "failure" - Phase failed (error message in description)
   * "pending" - Phase is waiting for prerequisites
   */
  status: "success" | "failure" | "pending";

  /**
   * Human-readable description of what happened.
   * On success: summary of generated artifacts
   * On failure: error message explaining what went wrong
   * On pending: explanation of missing prerequisites
   */
  description: string;
}
```

### Why This Design

**User-Friendly**: Five simple functions map directly to user intents:
- "Analyze my requirements" → `analyze()`
- "Create database schema" → `prisma()`
- "Design the APIs" → `interface()`
- "Write tests" → `test()`
- "Implement everything" → `realize()`

**Self-Documenting**: Function names and descriptions clearly communicate purpose. The LLM reads these and understands what each function does.

**Stateless**: Functions don't maintain state between calls. All state is in `AutoBeState`, accessed internally. The LLM doesn't manage state; it just calls functions.

**Flexible**: `instruction` parameter allows users to provide additional context or modifications without changing the interface.

## Function Calling Flow

### 1. Top-Level Agent Setup

**Location**: `packages/agent/src/AutoBeAgent.ts:60-182`

```typescript
export class AutoBeAgent {
  private readonly agentica_: Agentica<IAutoBeFacadeApplication, IAutoBeFacadeApplicationProps>;

  public constructor(props: AutoBeAgent.IProps) {
    // Create Agentica instance with facade interface
    this.agentica_ = new Agentica({
      model: props.model,
      application: typia.llm.application<IAutoBeFacadeApplication>(),
    });

    // Initialize with existing histories
    for (const history of props.histories ?? []) {
      this.agentica_.addHistory(history);
    }
  }

  public async conversate(message: string): Promise<void> {
    // User sends message
    await this.agentica_.converse({
      userMessage: message,
      // LLM can call any of the 5 facade functions
    });
  }
}
```

**Key Points**:
- `Agentica<IAutoBeFacadeApplication>` - Generic over facade interface
- `typia.llm.application<T>()` - Generates JSON schema from TypeScript interface
- LLM sees all 5 functions and their descriptions

### 2. LLM Decision Making

When the user sends a message, Claude analyzes it and decides which function (if any) to call.

**Example Conversation**:

```
User: "I need a blog API with posts and comments"

Claude (internal thought): User wants to start building. First step is analysis.
Claude (function call): analyze()

System: analyze() returns { status: "success", description: "Analyzed requirements. Identified 2 main resources: Post and Comment. Created 5 use cases." }

Claude (to user): "I've analyzed your requirements! I've identified two main resources (Post and Comment) and created detailed use cases. Would you like me to proceed with designing the database schema?"

User: "Yes, please"

Claude (function call): prisma({ instruction: "Create schema for blog with Post and Comment models" })

System: prisma() returns { status: "success", description: "Generated Prisma schema with Post and Comment models including relationships." }

Claude (to user): "Great! I've designed the database schema. Posts can have multiple Comments, and both have timestamps. Ready to design the API endpoints?"
```

**How Claude Knows What to Call**:
- Reads function descriptions from schema
- Understands current state from previous function results
- Maps user intent to appropriate function

### 3. Facade Implementation

**Location**: `packages/agent/src/factory/createAutoBeApplication.ts:28-111`

Each facade function is implemented as:

```typescript
const application: IAutoBeFacadeApplication = {
  analyze: async (): Promise<IAutoBeFacadeApplicationResult> => {
    try {
      // Check prerequisites
      const validation = validatePrerequisites(ctx.state());
      if (validation.failure) {
        return {
          status: "pending",
          description: validation.message,
        };
      }

      // Execute orchestrator
      await orchestrateAnalyze(ctx);

      // Return success
      return {
        status: "success",
        description: "Requirements analysis completed. Generated detailed documents covering actors, use cases, and specifications.",
      };
    } catch (error) {
      return {
        status: "failure",
        description: `Analysis failed: ${error.message}`,
      };
    }
  },

  prisma: async (props): Promise<IAutoBeFacadeApplicationResult> => {
    // Similar pattern
  },

  // ... other functions
};
```

**Pattern**:
1. Validate prerequisites (e.g., can't run Prisma without Analyze)
2. Call corresponding orchestrator
3. Return structured result
4. Catch errors and return failure status

### 4. Orchestrator Execution

When a facade function calls its orchestrator, the orchestrator manages the detailed workflow:

**Location**: `packages/agent/src/orchestrate/analyze/orchestrateAnalyze.ts`

```typescript
export const orchestrateAnalyze = async (ctx: IAutoBeContext): Promise<void> => {
  // Emit start event
  ctx.dispatch("analyzeStart", { ... });

  // Step 1: Plan what documents to write
  await orchestrateAnalyzeScenario(ctx);

  // Step 2: Write each document (parallelized)
  await orchestrateAnalyzeWrite(ctx);

  // Step 3: Review and improve documents
  await orchestrateAnalyzeReview(ctx);

  // Emit complete event
  ctx.dispatch("analyzeComplete", { ... });
};
```

The orchestrator breaks the high-level function into specialized sub-tasks, each using MicroAgentica internally.

### 5. Result Propagation

Results flow back through the layers:

```
Orchestrator completes
  ↓
Facade function returns IAutoBeFacadeApplicationResult
  ↓
Agentica receives return value
  ↓
Claude receives return value as function result
  ↓
Claude incorporates result into conversation
  ↓
Claude responds to user with summary
```

## State Validation

Facade functions validate state before executing to ensure prerequisites are met.

### Prerequisite Checks

**Location**: `packages/agent/src/orchestrate/facade/transformFacadeStateMessage.ts`

```typescript
export const validatePrismaPrerequisites = (state: AutoBeState): ValidationResult => {
  if (!state.analyze) {
    return {
      failure: true,
      message: "Cannot run prisma() - analyze() must be completed first."
    };
  }

  return { failure: false };
};

export const validateInterfacePrerequisites = (state: AutoBeState): ValidationResult => {
  if (!state.analyze) {
    return {
      failure: true,
      message: "Cannot run interface() - analyze() must be completed first."
    };
  }

  if (!state.database || state.database.analyzeStep !== state.analyze.step) {
    return {
      failure: true,
      message: "Cannot run interface() - prisma() must be completed and up-to-date."
    };
  }

  return { failure: false };
};
```

### Automatic Prerequisite Enforcement

The facade ensures correct ordering without user intervention:

```
User: "Implement the APIs"
Claude: realize()
System: { status: "pending", description: "Cannot run realize() - interface() and test() must be completed first." }
Claude: "I can't implement the APIs yet. We need to first design the API specification (interface) and create tests. Would you like me to do that?"
```

The LLM receives the prerequisite error and intelligently guides the user through the correct sequence.

## Instruction Parameter

The `instruction` parameter allows users to provide specific guidance without changing the facade interface.

### Use Cases

**1. Modification Requests**:
```
User: "Add authentication to the API"
Claude: interface({ instruction: "Add JWT authentication endpoints (signup, login, refresh token)" })
```

**2. Refinements**:
```
User: "Make the Post model include a published boolean"
Claude: prisma({ instruction: "Add published boolean field to Post model" })
```

**3. Additional Context**:
```
User: "Use PostgreSQL and enable UUID primary keys"
Claude: prisma({ instruction: "Use PostgreSQL with UUID primary keys for all models" })
```

### How Instructions Are Used

Instructions are passed to orchestrators, which include them in the history transformers:

**Location**: `packages/agent/src/orchestrate/prisma/histories/transformPrismaSchemaHistories.ts`

```typescript
export const transformPrismaSchemaHistories = (
  state: AutoBeState,
  instruction: string
): IAgenticaHistoryJson[] => {
  return [
    {
      role: "system",
      content: AutoBeSystemPromptConstant.DATABASE_SCHEMA,
    },
    {
      role: "user",
      content: `
        Analysis: ${JSON.stringify(state.analyze)}

        Additional Instructions: ${instruction}

        Generate the Prisma schema.
      `
    }
  ];
};
```

The instruction becomes part of the user message, influencing the LLM's generation.

## Error Handling

### Failure Propagation

When orchestrators encounter errors, they're captured and returned through the facade:

```typescript
try {
  await orchestratePrisma(ctx, props.instruction);
  return {
    status: "success",
    description: "Prisma schema generated successfully."
  };
} catch (error) {
  return {
    status: "failure",
    description: `Failed to generate Prisma schema: ${error.message}`
  };
}
```

Claude receives the failure and can explain it to the user or suggest fixes.

### Retry Opportunities

Since Claude controls function calling, it can retry failed operations:

```
Claude: prisma({ instruction: "..." })
System: { status: "failure", description: "Compilation error: invalid @relation attribute" }
Claude: prisma({ instruction: "Fix: use correct @relation syntax with fields and references" })
System: { status: "success", description: "Schema generated successfully" }
Claude (to user): "I encountered an error in the database schema but fixed it. The schema is now ready!"
```

This creates a **self-healing conversation loop** where Claude iteratively fixes issues without user intervention.

## Multi-Turn Conversations

Function calling enables complex multi-turn workflows:

### Example: Iterative Development

```
Turn 1:
User: "Create a todo app"
Claude: analyze()

Turn 2:
Claude (to user): "I've analyzed your requirements. Ready to proceed?"
User: "Yes"
Claude: prisma({ instruction: "Todo app schema" })

Turn 3:
Claude (to user): "Database schema created. Shall I design the APIs?"
User: "Yes, and add user authentication"
Claude: interface({ instruction: "Todo APIs with JWT authentication" })

Turn 4:
Claude (to user): "API design complete. Ready for implementation?"
User: "Actually, can you add priority levels to todos?"
Claude: prisma({ instruction: "Add priority enum to Todo model" })
// This invalidates interface, test, realize
Claude: interface({ instruction: "Regenerate with priority field" })

Turn 5:
Claude (to user): "Priority added! Now ready for tests and implementation?"
User: "Yes, do it all"
Claude: test({ instruction: "Test all endpoints including priority" })
Claude: realize({ instruction: "Implement with priority support" })
```

### State Management Across Turns

The `AutoBeState` persists across all turns. Function calls modify state, and subsequent calls see the updated state.

**Location**: `packages/agent/src/AutoBeAgent.ts:235-328`

```typescript
public state(): AutoBeState {
  return this.state_;  // Current state
}

private updateState(history: AutoBeHistory): void {
  if (history.type === "analyze") {
    this.state_.analyze = history;
  } else if (history.type === "database") {
    this.state_.database = history;
  }
  // ... update other phases
}
```

Each function call adds to history and updates state, creating a stateful conversation.

## Function Calling vs Direct Prompting

### Why Not Direct Prompting?

**Direct Prompting Approach** (AutoBE does NOT use this):
```
User: "Create a blog API"
System: "Here's the requirements analysis: ..."
User: "Now create the database schema"
System: "Here's the Prisma schema: ..."
```

**Problems**:
- User must manually orchestrate phases
- No validation of prerequisites
- LLM might generate wrong phase
- No structured error handling

**Function Calling Approach** (AutoBE's method):
```
User: "Create a blog API"
Claude: analyze() → System executes, returns result
Claude: "Analysis complete. Proceeding with schema..."
Claude: prisma() → System executes, validates, returns result
Claude: "Schema ready. Designing APIs..."
```

**Benefits**:
- LLM autonomously orchestrates phases
- Automatic prerequisite validation
- Structured results enable programmatic handling
- Clear separation between conversation and execution

## Schema Generation

### Automatic Schema from TypeScript

**Location**: Uses `typia.llm.application<T>()`

Given TypeScript interface:
```typescript
interface IAutoBeFacadeApplication {
  analyze(): Promise<IAutoBeFacadeApplicationResult>;
  prisma(props: { instruction: string }): Promise<IAutoBeFacadeApplicationResult>;
}
```

Generates JSON schema:
```json
{
  "functions": [
    {
      "name": "analyze",
      "description": "Analyze requirements from natural language into structured documents.",
      "parameters": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "database",
      "description": "Design Prisma database schema based on analyzed requirements.",
      "parameters": {
        "type": "object",
        "properties": {
          "instruction": {
            "type": "string",
            "description": "Additional instructions for schema generation"
          }
        },
        "required": ["instruction"]
      }
    }
  ]
}
```

This schema is sent to Claude, which uses it to understand available functions and their parameters.

## Best Practices

### 1. Keep Facade Simple

Facade functions should be high-level and user-focused:

**Good**:
```typescript
interface Facade {
  analyze(): Promise<Result>;
  prisma(props: { instruction: string }): Promise<Result>;
}
```

**Bad**:
```typescript
interface Facade {
  analyzeScenario(): Promise<Result>;
  analyzeWrite(): Promise<Result>;
  analyzeReview(): Promise<Result>;
  // Too granular - user doesn't care about sub-steps
}
```

### 2. Always Validate Prerequisites

```typescript
if (!state.analyze) {
  return { status: "pending", description: "Run analyze() first" };
}
```

### 3. Return Descriptive Results

**Good**:
```typescript
return {
  status: "success",
  description: "Generated Prisma schema with 5 models: User, Post, Comment, Tag, Like. Includes relations and indexes."
};
```

**Bad**:
```typescript
return {
  status: "success",
  description: "Done"  // Not helpful for LLM or user
};
```

### 4. Use Instruction Parameter

Allow users to provide context without changing interface:

```typescript
prisma(props: { instruction: string })  // Flexible

// Instead of:
prisma(props: { usePostgres: boolean, enableUUID: boolean, ... })  // Rigid
```

## Summary

Function calling transforms AutoBE from a rigid pipeline into an intelligent conversational system:

- **Facade Pattern**: Five simple functions hide complex orchestration
- **LLM Autonomy**: Claude decides when and how to call functions
- **State Validation**: Automatic prerequisite checking
- **Self-Healing**: LLM retries failed operations
- **Multi-Turn**: Stateful conversations enable iterative development
- **Type Safety**: TypeScript interfaces auto-generate schemas

This design makes AutoBE feel like talking to an expert developer who knows exactly what steps to take.
