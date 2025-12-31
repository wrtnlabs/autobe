# Type System

## The @autobe/interface Package

**Location**: `packages/interface/`

AutoBE's type system is centralized in the `@autobe/interface` package, which serves as the **single source of truth** for all types across the entire codebase. This package defines contracts for:

- Event structures (65+ event types)
- History records (conversation + phase histories)
- AST representations (Prisma schema, OpenAPI document)
- Compiler interfaces
- RPC communication protocols

Every package depends on `@autobe/interface`, creating a type-safe contract layer:

```
@autobe/interface (types only)
        ↑
        ├─ @autobe/agent (implements agents)
        ├─ @autobe/compiler (implements compilers)
        ├─ @autobe/rpc (implements RPC service)
        ├─ @autobe/ui (React components)
        └─ @autobe/website (Next.js app)
```

## Type-Safe Contracts with Discriminated Unions

### History Type System

**Location**: `packages/interface/src/histories/AutoBeHistory.ts`

AutoBE uses **discriminated unions** with a **mapper pattern** for type-safe history handling:

```typescript
export type AutoBeHistory =
  | AutoBeUserMessageHistory
  | AutoBeAssistantMessageHistory
  | AutoBeAnalyzeHistory
  | AutoBeDatabaseHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;

export namespace AutoBeHistory {
  // Extract discriminator type
  export type Type = AutoBeHistory["type"];

  // Map type strings to concrete interfaces
  export interface Mapper {
    userMessage: AutoBeUserMessageHistory;
    assistantMessage: AutoBeAssistantMessageHistory;
    analyze: AutoBeAnalyzeHistory;
    prisma: AutoBeDatabaseHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
```

**Benefits**:
1. **Type Narrowing** - TypeScript infers exact type from discriminator
2. **Generic Handling** - Write functions that work with any history type
3. **Compile-Time Safety** - No casting or type assertions needed
4. **IDE Autocomplete** - Full intellisense support

**Usage Example**:

```typescript
function getHistory<T extends AutoBeHistory.Type>(
  histories: AutoBeHistory[],
  type: T
): AutoBeHistory.Mapper[T] | undefined {
  return histories.find((h) => h.type === type) as
    | AutoBeHistory.Mapper[T]
    | undefined;
}

// TypeScript infers exact return type
const analyze: AutoBeAnalyzeHistory | undefined = getHistory(histories, "analyze");
const database: AutoBeDatabaseHistory | undefined = getHistory(histories, "database");
```

### Event Type System

Events use the same mapper pattern:

```typescript
// @autobe/interface/src/events/AutoBeEvent.ts
export type AutoBeEvent =
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeScenarioEvent
  | AutoBeAnalyzeWriteEvent
  // ... 60+ more event types

export namespace AutoBeEvent {
  export type Type = AutoBeEvent["type"];

  export interface Mapper {
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeScenario: AutoBeAnalyzeScenarioEvent;
    analyzeWrite: AutoBeAnalyzeWriteEvent;
    // ... 60+ more mappings
  }
}
```

**Type-Safe Event Handling**:

```typescript
function handleEvent<T extends AutoBeEvent.Type>(
  type: T,
  handler: (event: AutoBeEvent.Mapper[T]) => void
): void {
  // TypeScript knows exact event type from type parameter
}

handleEvent("analyzeStart", (event) => {
  // event is AutoBeAnalyzeStartEvent
  console.log(event.step);
});

handleEvent("realizeWrite", (event) => {
  // event is AutoBeRealizeWriteEvent
  console.log(event.operation.path);
});
```

## AST Type System

### AutoBeOpenApi AST

**Location**: `packages/interface/src/openapi/AutoBeOpenApi.ts:70-1811`

AutoBE defines a **simplified OpenAPI AST** optimized for AI generation. Unlike standard OpenAPI 3.1, this AST removes ambiguity and duplicated expressions.

**Key Design Principles**:

1. **Single Discriminator** - `type` field is always a single string, never an array
2. **Union via IOneOf** - Nullable types use explicit oneOf structure
3. **Named References** - All body types reference named schemas in components
4. **Required Descriptions** - Every schema has detailed description

**Core Structure**:

```typescript
export namespace AutoBeOpenApi {
  export interface IDocument {
    operations: IOperation[];  // All API endpoints
    components: IComponents;   // Reusable schemas
  }

  export interface IOperation extends IEndpoint {
    specification: string;
    authorizationType: "login" | "join" | "refresh" | null;
    description: string;  // Must be detailed, multi-paragraph
    summary: string;
    parameters: IParameter[];
    requestBody: IRequestBody | null;
    responseBody: IResponseBody | null;
    authorizationActor: string | null;
    name: string;  // Functional name (e.g., "create", "update")
    prerequisites: IPrerequisite[];  // API dependencies
  }

  export interface IComponents {
    schemas: Record<string, IJsonSchemaDescriptive>;
    authorizations: IAuthorization[];
  }

  export type IJsonSchema =
    | IJsonSchema.IConstant
    | IJsonSchema.IBoolean
    | IJsonSchema.IInteger
    | IJsonSchema.INumber
    | IJsonSchema.IString
    | IJsonSchema.IArray
    | IJsonSchema.IObject
    | IJsonSchema.IReference
    | IJsonSchema.IOneOf
    | IJsonSchema.INull;
}
```

**Critical Difference from Standard OpenAPI**:

```typescript
// ❌ FORBIDDEN in AutoBeOpenApi - Array notation
{
  "type": ["string", "null"]
}

// ✅ CORRECT in AutoBeOpenApi - IOneOf structure
{
  "oneOf": [
    { "type": "string" },
    { "type": "null" }
  ]
}
```

**Why This Matters**: The LLM must generate precise discriminated unions. Array notation is ambiguous and can cause parser errors. IOneOf structure is explicit and unambiguous.

### Type Naming Conventions

AutoBeOpenApi enforces strict naming conventions documented in the AST:

**Main Entity Types**:
- `IEntityName` - Full entity (e.g., `IShoppingSale`)
- Must map 1:1 to Prisma schema table

**Operation-Specific Types**:
- `IEntityName.ICreate` - POST request body
- `IEntityName.IUpdate` - PUT request body
- `IEntityName.IRequest` - Search/filter/pagination params

**View Types**:
- `IEntityName.ISummary` - Simplified for list operations
- `IEntityName.IInvert` - Alternative perspective

**Container Types**:
- `IPageIEntityName` - Paginated results with `pagination` and `data`

## Runtime Type Validation with Typia

AutoBE uses **Typia** for compile-time generated runtime validation.

### What is Typia?

Typia is a TypeScript transformer that generates validation code at compile time:

```typescript
import typia from "typia";

interface IUser {
  id: string;
  email: string;
  age: number;
}

// Typia generates validation function at compile time
const validate = typia.validate<IUser>;

// At runtime, validation is ultra-fast native code
const result = validate(input);
if (result.success) {
  console.log(result.data);  // Type: IUser
} else {
  console.log(result.errors);  // Detailed error list
}
```

**Key Advantage**: No reflection overhead. Validation code is generated during TypeScript compilation, resulting in 20-100x faster validation than alternatives like Zod or io-ts.

### Typia in Function Calling

**Location**: `packages/agent/src/orchestrate/realize/orchestrateRealizeCorrect.ts:277-317`

Typia validates LLM function call outputs:

```typescript
function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  build: (next: IAutoBeRealizeCorrectApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  // Define validator with Typia
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCorrectApplication.IProps> =
      typia.validate<IAutoBeRealizeCorrectApplication.IProps>(input);

    if (result.success === false) return result;

    // Additional custom validation
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });

    return errors.length
      ? { success: false, errors, data: result.data }
      : result;
  };

  // Generate LLM application schema
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](validate);

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      correct: (next) => {
        props.build(next);  // IPointer captures validated result
      },
    },
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">({
      validate: { correct: validate },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCorrectApplication, "claude">({
      validate: { correct: validate },
    }),
};
```

**Two-Stage Validation**:
1. **Typia Schema Validation** - Verifies type structure
2. **Business Logic Validation** - Checks for empty code, missing functions

### Typia LLM Schema Generation

Typia generates LLM function schemas automatically:

```typescript
// Type definition
interface IAutoBeRealizeCorrectApplication {
  correct(props: IProps): void;
}

namespace IAutoBeRealizeCorrectApplication {
  export interface IProps {
    draft: string;
    revise: {
      thought: string;
      final: string | null;
    };
  }
}

// Typia generates JSON schema for this interface
const schema = typia.llm.application<
  IAutoBeRealizeCorrectApplication,
  "claude"
>();

// Result: Claude-compatible function calling schema
{
  "name": "correct",
  "description": "...",
  "input_schema": {
    "type": "object",
    "properties": {
      "draft": { "type": "string" },
      "revise": {
        "type": "object",
        "properties": {
          "thought": { "type": "string" },
          "final": { "type": ["string", "null"] }
        }
      }
    },
    "required": ["draft", "revise"]
  }
}
```

**Multi-Provider Support**: Typia generates different schemas for different LLM providers (`"chatgpt"` vs `"claude"`), handling provider-specific quirks automatically.

## Type-Safe RPC with TGrid

### IAutoBeRpcListener Interface

**Location**: `packages/interface/src/rpc/IAutoBeRpcListener.ts`

The RPC listener interface defines all client-callable methods:

```typescript
export interface IAutoBeRpcListener {
  enable(value: boolean): Promise<void>;

  // User/Assistant messages
  userMessage(event: AutoBeUserMessageEvent): Promise<void>;
  assistantMessage(event: AutoBeAssistantMessageEvent): Promise<void>;

  // Analyze events
  analyzeStart(event: AutoBeAnalyzeStartEvent): Promise<void>;
  analyzeScenario(event: AutoBeAnalyzeScenarioEvent): Promise<void>;
  analyzeWrite(event: AutoBeAnalyzeWriteEvent): Promise<void>;
  // ... all 65+ events
}
```

### Automatic RPC Forwarding

**Location**: `packages/rpc/src/AutoBeRpcService.ts:29-50`

AutoBE uses Typia's `typia.misc.literals<>()` to enumerate interface methods at compile time:

```typescript
export class AutoBeRpcService {
  public constructor(props: { agent: AutoBeAgent; listener: IAutoBeRpcListener }) {
    const { agent, listener } = props;

    // Enumerate all IAutoBeRpcListener methods at compile time
    for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
      if (key === "enable") continue;

      // Automatically forward agent events to remote listener
      agent.on(key, (event) => {
        listener[key]!(event as any).catch(() => {});  // Fire-and-forget
      });
    }
  }
}
```

**Key Insight**: Adding a new event type automatically includes it in RPC forwarding. No manual registration needed.

**How `typia.misc.literals<>()` Works**:

```typescript
// At compile time, Typia generates:
const keys: Array<keyof IAutoBeRpcListener> = [
  "enable",
  "userMessage",
  "assistantMessage",
  "analyzeStart",
  // ... all 65+ method names
];

// This enables compile-time safe iteration over interface methods
```

### WebSocket Communication

TGrid wraps WebSocket connections with type-safe RPC:

```typescript
// Server-side
const listener = await driver.getDriver<IAutoBeRpcListener>();
listener.analyzeStart(event);  // Type-safe, serialized over WebSocket

// Client-side
const service = new AutoBeRpcService({
  agent,
  listener: {
    analyzeStart: async (event) => {
      console.log("Received:", event);  // Type: AutoBeAnalyzeStartEvent
    },
    // ... other handlers
  },
});
```

**Serialization**: TGrid automatically serializes/deserializes TypeScript objects to/from JSON, preserving type information.

## Compiler Interface Types

**Location**: `packages/interface/src/compiler/IAutoBeCompiler.ts`

Compiler interfaces define contracts for validation and code generation:

```typescript
export interface IAutoBeCompiler {
  prisma: IAutoBeDatabaseCompiler;
  interface: IAutoBeInterfaceCompiler;
  test: IAutoBeTestCompiler;
  typescript: IAutoBeTypeScriptCompiler;
  realize: {
    controller(props: IAutoBeRealizeControllerProps): Promise<Record<string, string>>;
    test(props: IAutoBeRealizeTestProps): Promise<IAutoBeRealizeTestResult>;
  };
}

export interface IAutoBeDatabaseCompiler {
  compile(props: IAutoBeDatabaseCompileProps): Promise<IAutoBeDatabaseCompileResult>;
}

export interface IAutoBeDatabaseCompileResult {
  type: "success" | "failure";
  schemas?: PrismaSchema[];  // If success
  diagnostics?: IDiagnostic[];  // If failure
}
```

**Type Safety Benefit**: Orchestrators can't call compiler methods incorrectly. TypeScript enforces correct props and validates result structure.

## Type-Driven Development Workflow

### 1. Define Types in @autobe/interface

```typescript
// packages/interface/src/events/AutoBeNewFeatureEvent.ts
export interface AutoBeNewFeatureEvent {
  type: "newFeature";
  id: string;
  data: string;
  created_at: string;
}
```

### 2. Add to Union and Mapper

```typescript
// packages/interface/src/events/AutoBeEvent.ts
export type AutoBeEvent =
  | ...
  | AutoBeNewFeatureEvent;

export namespace AutoBeEvent {
  export interface Mapper {
    // ...
    newFeature: AutoBeNewFeatureEvent;
  }
}
```

### 3. Add to RPC Listener

```typescript
// packages/interface/src/rpc/IAutoBeRpcListener.ts
export interface IAutoBeRpcListener {
  // ...
  newFeature(event: AutoBeNewFeatureEvent): Promise<void>;
}
```

### 4. Implement in Agent

```typescript
// packages/agent/src/orchestrate/new/orchestrateNewFeature.ts
ctx.dispatch({
  type: "newFeature",
  id: v7(),
  data: "example",
  created_at: new Date().toISOString(),
});
```

### 5. Automatically Available via RPC

The `AutoBeRpcService` constructor automatically forwards the new event type to remote listeners. No code changes needed in RPC layer!

## Type System Best Practices

### 1. Never Use `any`

```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good
function process<T extends { value: string }>(data: T): string {
  return data.value;
}
```

### 2. Use Discriminated Unions

```typescript
// ❌ Bad - requires type narrowing
interface Result {
  success?: boolean;
  data?: string;
  error?: string;
}

// ✅ Good - type narrows automatically
type Result =
  | { type: "success"; data: string }
  | { type: "failure"; error: string };

if (result.type === "success") {
  console.log(result.data);  // TypeScript knows data exists
}
```

### 3. Use Mapper Pattern for Generic Handlers

```typescript
// ✅ Good - type-safe generic handling
function dispatch<T extends AutoBeEvent.Type>(
  type: T,
  event: AutoBeEvent.Mapper[T]
): void {
  // TypeScript enforces correct event type for given type string
}
```

### 4. Leverage Typia for Validation

```typescript
// ✅ Good - compile-time generated validation
const result = typia.validate<MyType>(input);
if (!result.success) {
  console.log(result.errors);  // Detailed error paths
}
```

### 5. Define Types Before Implementation

Always start with type definitions in `@autobe/interface`, then implement in other packages. This ensures type-safe contracts from the start.

## Summary

AutoBE's type system provides:

- **Single Source of Truth** - `@autobe/interface` defines all contracts
- **Discriminated Unions** - Type-safe handling with mapper pattern
- **Simplified AST** - OpenAPI without ambiguity
- **Runtime Validation** - Typia for ultra-fast type checking
- **Type-Safe RPC** - TGrid with automatic serialization
- **Automatic Forwarding** - Compile-time method enumeration
- **Zero Casting** - Type narrowing through discriminators

This architecture enables AutoBE to maintain 100% type safety across the entire pipeline from LLM output to generated code.
