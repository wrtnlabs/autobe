# Event System

## Event-Driven Architecture

AutoBE uses event sourcing patterns where every state change is represented as an immutable event. The event stream serves as both a progress log and a mechanism for state reconstruction.

## Event Types

**Location**: `packages/interface/src/events/AutoBeEvent.ts`

AutoBE defines 65+ distinct event types organized by pipeline phase.

### Event Type Definition

```typescript
export type AutoBeEvent =
  // User/Assistant messages
  | AutoBeUserMessageEvent
  | AutoBeAssistantMessageEvent

  // Analyze phase (7 events)
  | AutoBeAnalyzeStartEvent
  | AutoBeAnalyzeScenarioEvent
  | AutoBeAnalyzeWriteEvent
  | AutoBeAnalyzeReviewEvent
  | AutoBeAnalyzeCompleteEvent

  // Database phase (9 events)
  | AutoBeDatabaseStartEvent
  | AutoBeDatabaseComponentEvent
  | AutoBeDatabaseSchemaEvent
  | AutoBeDatabaseInsufficientEvent
  | AutoBeDatabaseSchemaReviewEvent
  | AutoBeDatabaseValidateEvent
  | AutoBeDatabaseCorrectEvent
  | AutoBeDatabaseCompleteEvent

  // Interface phase (15+ events)
  | AutoBeInterfaceStartEvent
  | AutoBeInterfaceGroupEvent
  | AutoBeInterfaceEndpointEvent
  | AutoBeInterfaceEndpointReviewEvent
  | AutoBeInterfaceOperationEvent
  | AutoBeInterfaceOperationReviewEvent
  | AutoBeInterfaceAuthorizationEvent
  | AutoBeInterfaceSchemaEvent
  | AutoBeInterfaceSchemaSecurityReviewEvent
  | AutoBeInterfaceSchemaRelationReviewEvent
  | AutoBeInterfaceSchemaContentReviewEvent
  | AutoBeInterfaceComplementEvent
  | AutoBeInterfacePrerequisiteEvent
  | AutoBeInterfaceCompleteEvent

  // Test phase (7 events)
  | AutoBeTestStartEvent
  | AutoBeTestScenarioEvent
  | AutoBeTestScenarioReviewEvent
  | AutoBeTestWriteEvent
  | AutoBeTestCorrectEvent
  | AutoBeTestCorrectInvalidRequestEvent
  | AutoBeTestCompleteEvent

  // Realize phase (6 events)
  | AutoBeRealizeStartEvent
  | AutoBeRealizeAuthorizationEvent
  | AutoBeRealizeAuthorizationCorrectEvent
  | AutoBeRealizeWriteEvent
  | AutoBeRealizeCorrectEvent
  | AutoBeRealizeCompleteEvent

  // Vendor/Progress events
  | AutoBeVendorRequestEvent
  | AutoBeProgressEvent;
```

### Event Categories

**Lifecycle Events**: `*Start`, `*Complete` - Mark phase boundaries
**Planning Events**: `*Scenario` - Describe what will be generated
**Generation Events**: `*Write`, `*Operation`, `*Schema` - Report generation progress
**Review Events**: `*Review` - Report quality checks
**Correction Events**: `*Correct` - Report error fixes
**Progress Events**: `*Progress` - Report quantitative progress (N/M completed)

## Type-Safe Event Mapper

AutoBE uses a **mapper pattern** for compile-time type safety when handling events.

### Mapper Definition

```typescript
export namespace AutoBeEvent {
  // Extract all event type strings
  export type Type = AutoBeEvent["type"];

  // Map type strings to concrete interfaces
  export interface Mapper {
    userMessage: AutoBeUserMessageEvent;
    assistantMessage: AutoBeAssistantMessageEvent;
    analyzeStart: AutoBeAnalyzeStartEvent;
    analyzeScenario: AutoBeAnalyzeScenarioEvent;
    analyzeWrite: AutoBeAnalyzeWriteEvent;
    // ... 60+ more mappings
  }
}
```

### Type-Safe Event Handling

This pattern enables generic event handlers with full type inference:

```typescript
function handleEvent<T extends AutoBeEvent.Type>(
  type: T,
  handler: (event: AutoBeEvent.Mapper[T]) => void
): void {
  // TypeScript knows the exact event type based on the string literal
}

// Usage
handleEvent("analyzeStart", (event) => {
  // event is typed as AutoBeAnalyzeStartEvent
  console.log(event.step);  // Type-safe property access
});

handleEvent("realizeWrite", (event) => {
  // event is typed as AutoBeRealizeWriteEvent
  console.log(event.operation.path);  // Different type, different properties
});
```

### EventEmitter Integration

**Location**: `packages/agent/src/AutoBeAgentBase.ts`

```typescript
export abstract class AutoBeAgentBase {
  private readonly emitter_: EventEmitter<AutoBeEvent.Mapper> = new EventEmitter();

  // Type-safe event emission
  protected emit<T extends AutoBeEvent.Type>(
    type: T,
    event: AutoBeEvent.Mapper[T]
  ): void {
    this.emitter_.emit(type, event);
  }

  // Type-safe event subscription
  public on<T extends AutoBeEvent.Type>(
    type: T,
    listener: (event: AutoBeEvent.Mapper[T]) => void | Promise<void>
  ): void {
    this.emitter_.on(type, listener);
  }
}
```

## Event Emission

### Where Events Are Emitted

Events are emitted at key points in orchestrators:

**Location**: `packages/agent/src/orchestrate/analyze/orchestrateAnalyze.ts`

```typescript
export const orchestrateAnalyze = async (ctx: IAutoBeContext): Promise<void> => {
  // Emit start event
  ctx.dispatch("analyzeStart", {
    type: "analyzeStart",
    step: ctx.state().analyze?.step ?? 0 + 1,
  });

  try {
    // Execute sub-orchestrators
    await orchestrateAnalyzeScenario(ctx);
    await orchestrateAnalyzeWrite(ctx);
    await orchestrateAnalyzeReview(ctx);

    // Emit complete event with results
    ctx.dispatch("analyzeComplete", {
      type: "analyzeComplete",
      step: currentStep,
      documents: generatedDocuments,
      // ... complete analysis results
    });
  } catch (error) {
    // Could emit failure event
    throw error;
  }
};
```

### Dispatch Method

**Location**: `packages/agent/src/factory/createAutoBeContext.ts`

```typescript
dispatch: <T extends AutoBeEvent.Type>(
  type: T,
  event: AutoBeEvent.Mapper[T]
): void => {
  // Add to event history
  agent.addHistory(event);

  // Emit to listeners
  agent.emit(type, event);

  // Update state if it's a complete event
  if (type.endsWith("Complete")) {
    updateState(event);
  }
}
```

## Progress Tracking

### Progress Events

Progress events report quantitative completion status:

```typescript
export interface AutoBeProgressEvent {
  type: "progress";
  source: string;  // e.g., "realizeWrite", "interfaceOperation"
  completed: number;  // How many done
  total: number;      // How many total
}
```

### Emission Pattern

```typescript
// Before batch processing
ctx.dispatch("progress", {
  type: "progress",
  source: "realizeWrite",
  completed: 0,
  total: 40,
});

// After each item
for (let i = 0; i < operations.length; i++) {
  await generateOperation(operations[i]);

  ctx.dispatch("progress", {
    type: "progress",
    source: "realizeWrite",
    completed: i + 1,
    total: operations.length,
  });
}
```

### Frontend Integration

Frontends subscribe to progress events to update UI:

```typescript
agent.on("progress", (event) => {
  if (event.source === "realizeWrite") {
    updateProgressBar(event.completed / event.total);
  }
});
```

## Event Streaming

### WebSocket RPC Integration

**Location**: `packages/rpc/src/AutoBeRpcService.ts`

Events are automatically streamed to remote clients over WebSocket:

```typescript
export class AutoBeRpcService {
  public constructor(props: { agent: AutoBeAgent; listener: IAutoBeRpcListener }) {
    const { agent, listener } = props;

    // Automatically forward ALL events to remote listener
    for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
      if (key === "enable") continue;

      agent.on(key, (event) => {
        listener[key]!(event as any).catch(() => {});  // Fire-and-forget
      });
    }
  }
}
```

**Key Insight**: Using `typia.misc.literals<>()` to enumerate all event types at compile time enables automatic forwarding without manual registration. Adding a new event type automatically includes it in RPC streaming.

### Listener Interface

**Location**: `packages/interface/src/rpc/IAutoBeRpcListener.ts`

```typescript
export interface IAutoBeRpcListener {
  enable(value: boolean): Promise<void>;

  // User/Assistant messages
  userMessage(event: AutoBeUserMessageEvent): Promise<void>;
  assistantMessage(event: AutoBeAssistantMessageEvent): Promise<void>;

  // Analyze events
  analyzeStart(event: AutoBeAnalyzeStartEvent): Promise<void>;
  analyzeScenario(event: AutoBeAnalyzeScenarioEvent): Promise<void>;
  // ... all 65+ events
}
```

Clients implement this interface to receive events. TGrid handles serialization and WebSocket transport automatically.

## Event Persistence

### Event History Storage

**Location**: `packages/agent/src/AutoBeAgent.ts:88-113`

```typescript
export class AutoBeAgent {
  private readonly histories_: AutoBeHistory[] = [];

  public addHistory(history: AutoBeHistory): void {
    this.histories_.push(history);

    // Update state based on history type
    if (history.type === "analyze") {
      this.state_.analyze = history;
    } else if (history.type === "database") {
      this.state_.database = history;
    }
    // ...
  }

  public getHistories(): readonly AutoBeHistory[] {
    return this.histories_;
  }
}
```

### Event Replay

When loading a session, events are replayed to reconstruct state:

```typescript
const agent = new AutoBeAgent({
  model: model,
  compiler: compiler,
  histories: loadedHistories,  // Replay these
});

// State is automatically rebuilt from histories
console.log(agent.state().analyze);  // Reconstructed from analyzeComplete event
console.log(agent.state().database); // Reconstructed from databaseComplete event
```

### Event Serialization

Events are serialized to JSON for storage:

```typescript
// Save session
const json = JSON.stringify(agent.getHistories());
await fs.writeFile("session.json", json);

// Load session
const json = await fs.readFile("session.json");
const histories = JSON.parse(json) as AutoBeHistory[];
const agent = new AutoBeAgent({ histories });
```

## Event Filtering and Grouping

### Frontend Event Grouping

**Location**: `packages/ui/src/components/events/utils/eventGrouper.tsx`

Frontends group events by phase for better visualization:

```typescript
export const groupEvents = (events: AutoBeEvent[]): EventGroup[] => {
  const groups: EventGroup[] = [];
  let currentGroup: EventGroup | null = null;

  for (const event of events) {
    if (event.type.endsWith("Start")) {
      // Start new group
      currentGroup = {
        phase: extractPhase(event.type),  // "analyze", "database", etc.
        events: [event],
        status: "in-progress",
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // Add to current group
      currentGroup.events.push(event);

      if (event.type.endsWith("Complete")) {
        currentGroup.status = "completed";
        currentGroup = null;
      }
    }
  }

  return groups;
};
```

### Event Filtering

Frontends can filter events by type, phase, or status:

```typescript
// Get all Realize events
const realizeEvents = events.filter(e => e.type.startsWith("realize"));

// Get all error events
const errorEvents = events.filter(e =>
  e.type.includes("Correct") || e.type.includes("Insufficient")
);

// Get all Progress events
const progressEvents = events.filter(e => e.type === "progress");
```

## Vendor Request Events

### Tracking LLM API Calls

**Location**: `packages/interface/src/events/AutoBeVendorRequestEvent.ts`

```typescript
export interface AutoBeVendorRequestEvent {
  type: "vendorRequest";
  source: string;       // Which orchestrator made the request
  model: string;        // Which model was used
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;  // For prompt caching
}
```

### Usage

Emitted after each LLM API call:

```typescript
const { result, tokenUsage } = await ctx.conversate({...});

ctx.dispatch("vendorRequest", {
  type: "vendorRequest",
  source: "analyzeWrite",
  model: ctx.model.name,
  inputTokens: tokenUsage.input,
  outputTokens: tokenUsage.output,
  cachedTokens: tokenUsage.cached,
});
```

### Analytics

Frontends can aggregate vendor events for cost tracking:

```typescript
const totalCost = vendorEvents.reduce((sum, event) => {
  const cost = calculateCost(event.model, event.inputTokens, event.outputTokens);
  return sum + cost;
}, 0);

console.log(`Total LLM cost: $${totalCost.toFixed(2)}`);
```

## Event-Driven State Updates

### Automatic State Synchronization

Complete events automatically update state:

```typescript
ctx.dispatch("analyzeComplete", {
  type: "analyzeComplete",
  step: 1,
  documents: [...],
  // ... full analysis history
});

// Internally triggers:
agent.state_.analyze = event;  // State updated with complete history
```

### State Invalidation via Events

When a phase reruns, its start event invalidates downstream state:

```typescript
ctx.dispatch("analyzeStart", {
  type: "analyzeStart",
  step: 2,  // Incremented from 1
});

// Downstream phases become invalid because step changed
// No explicit invalidation needed - checked on next access
```

## Testing with Events

### Event Assertions

Tests can assert on emitted events:

```typescript
test("Analyze phase emits correct events", async () => {
  const events: AutoBeEvent[] = [];

  agent.on("analyzeStart", (e) => events.push(e));
  agent.on("analyzeScenario", (e) => events.push(e));
  agent.on("analyzeComplete", (e) => events.push(e));

  await orchestrateAnalyze(context);

  expect(events).toHaveLength(3);
  expect(events[0].type).toBe("analyzeStart");
  expect(events[1].type).toBe("analyzeScenario");
  expect(events[2].type).toBe("analyzeComplete");
});
```

### Mocking Event Streams

Tests can inject pre-recorded event streams:

```typescript
const mockHistories: AutoBeHistory[] = [
  { type: "analyze", step: 1, documents: [...] },
  { type: "database", step: 1, analyzeStep: 1, schemas: [...] },
];

const agent = new AutoBeAgent({
  model: mockModel,
  compiler: mockCompiler,
  histories: mockHistories,  // Inject mocked history
});

// Agent state is reconstructed from mocked events
expect(agent.state().analyze).toBeDefined();
expect(agent.state().prisma).toBeDefined();
```

## Best Practices

### 1. Emit Events at Key Points

```typescript
// Start of phase
ctx.dispatch("phaseStart", {...});

// After each major operation
ctx.dispatch("phaseOperation", {...});

// On completion
ctx.dispatch("phaseComplete", {...});
```

### 2. Include Sufficient Context

Events should be self-contained:

```typescript
// Good
ctx.dispatch("realizeWrite", {
  type: "realizeWrite",
  operation: {
    path: "/api/users",
    method: "POST",
  },
  files: [...],  // Complete file list
});

// Bad
ctx.dispatch("realizeWrite", {
  type: "realizeWrite",
  operationId: "createUser",  // Requires lookup
});
```

### 3. Use Progress Events for Long Operations

```typescript
for (let i = 0; i < items.length; i++) {
  await processItem(items[i]);

  ctx.dispatch("progress", {
    type: "progress",
    source: "batchOperation",
    completed: i + 1,
    total: items.length,
  });
}
```

### 4. Handle Events Asynchronously

Listeners should not block the emitter:

```typescript
// Good
agent.on("realizeComplete", async (event) => {
  await saveToDatabase(event);  // Async, non-blocking
});

// Bad
agent.on("realizeComplete", (event) => {
  saveToDatabase(event);  // Blocks emitter
});
```

## Summary

AutoBE's event system provides:

- **Type Safety**: Mapper pattern ensures compile-time correctness
- **Event Sourcing**: State reconstructed from event stream
- **Progress Tracking**: Real-time progress events for UX
- **RPC Streaming**: Automatic WebSocket forwarding
- **Debuggability**: Complete event log for troubleshooting
- **Testability**: Events enable assertion-based testing

The event-driven architecture makes AutoBE's complex pipeline transparent, debuggable, and extensible.
