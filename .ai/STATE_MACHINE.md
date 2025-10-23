# State Machine

## State Management Philosophy

AutoBE implements a sophisticated state machine where phase transitions are validated, dependencies are tracked, and state invalidation is automatic. The state machine ensures that phases execute in the correct order and that outdated artifacts are never used.

## State Structure

**Location**: `packages/agent/src/context/AutoBeState.ts`

```typescript
export interface AutoBeState {
  analyze: AutoBeAnalyzeHistory | null;
  prisma: AutoBePrismaHistory | null;
  interface: AutoBeInterfaceHistory | null;
  test: AutoBeTestHistory | null;
  realize: AutoBeRealizeHistory | null;
}
```

Each field represents a pipeline phase. A `null` value means the phase hasn't executed yet. A non-null value contains the complete history of that phase including all generated artifacts, events, and metadata.

## Step Counter Pattern

The core innovation in AutoBE's state machine is the **step counter pattern** for automatic dependency tracking and invalidation.

### How It Works

Every history object includes a `step` number:

```typescript
export interface AutoBeAnalyzeHistory {
  step: number;  // Increments on each execution
  // ... other fields
}

export interface AutoBePrismaHistory {
  step: number;           // This phase's step
  analyzeStep: number;    // The Analyze step this was built against
  // ... other fields
}
```

When Analyze runs:
1. Its step counter increments (e.g., from 1 to 2)
2. All dependent phases (Prisma, Interface, Test, Realize) are now "out-of-date" because they reference the old Analyze step

When Prisma runs:
1. It records `analyzeStep = state.analyze.step` (capturing the current Analyze version)
2. Its own step counter increments
3. All dependent phases (Interface, Test, Realize) become out-of-date

### Dependency Graph

```
Requirements (user input)
    ↓
Analyze (step: N)
    ↓
Prisma (step: M, analyzeStep: N)
    ↓
Interface (step: P, analyzeStep: N, prismaStep: M)
    ↓
Test (step: Q, analyzeStep: N, interfaceStep: P)
    ↓
Realize (step: R, analyzeStep: N, interfaceStep: P)
```

If Analyze reruns and its step changes from N to N+1, all downstream phases that reference `analyzeStep: N` are automatically invalid.

### Implementation

**Location**: `packages/agent/src/orchestrate/facade/transformFacadeStateMessage.ts`

```typescript
export const transformFacadeStateMessage = (state: AutoBeState): string => {
  const analyze = state.analyze;
  if (!analyze) {
    return "Requirements analysis has not been completed yet. Please run analyze() first.";
  }

  const prisma = state.prisma;
  if (!prisma || prisma.analyzeStep !== analyze.step) {
    return "Prisma schema is out-of-date or not generated. Please run prisma() first.";
  }

  const interface_ = state.interface;
  if (!interface_ ||
      interface_.analyzeStep !== analyze.step ||
      interface_.prismaStep !== prisma.step) {
    return "OpenAPI specification is out-of-date or not generated. Please run interface() first.";
  }

  // ... similar checks for test and realize
};
```

This function is called before each facade function executes. It validates that all prerequisites are satisfied and up-to-date. If not, it returns an error message explaining which phase needs to be run.

## State Transitions

### Valid Transitions

1. **Initial → Analyze**: Always allowed. Starts the pipeline.
2. **Analyze Complete → Prisma**: Allowed if Analyze completed successfully.
3. **Prisma Complete → Interface**: Allowed if Prisma completed successfully and matches Analyze step.
4. **Interface Complete → Test**: Allowed if Interface completed successfully and matches Analyze + Prisma steps.
5. **Test Complete → Realize**: Allowed if Test completed successfully and matches all prerequisite steps.

### Invalid Transitions

Attempting to jump phases is blocked:
- Cannot run Prisma if Analyze hasn't completed
- Cannot run Interface if Prisma is missing or out-of-date
- Cannot run Realize if Test hasn't completed

The facade function returns an error message instead of executing:

```typescript
if (!isValidTransition(state, requestedPhase)) {
  return {
    status: "failure",
    description: transformFacadeStateMessage(state)
  };
}
```

## State Invalidation

When a phase reruns, all dependent phases are automatically invalidated through the step counter mechanism.

### Cascade Invalidation

**Scenario**: User realizes the requirements were wrong after Interface was generated.

1. User modifies requirements and reruns Analyze
2. Analyze step increments: `analyze.step = 2` (was 1)
3. Prisma history still exists but `prisma.analyzeStep = 1` (doesn't match current `analyze.step = 2`)
4. Interface history exists but `interface_.analyzeStep = 1` (out-of-date)
5. Test history exists but `test.analyzeStep = 1` (out-of-date)
6. Realize history exists but `realize.analyzeStep = 1` (out-of-date)

All phases are now effectively invalid without explicit deletion. The facade validation will require rerunning Prisma, then Interface, then Test, then Realize in sequence.

### Selective Invalidation

**Scenario**: User wants to regenerate just the Prisma schema without changing requirements.

1. User reruns Prisma with modified instructions
2. Prisma step increments: `prisma.step = 2` (was 1)
3. Analyze is unaffected: `analyze.step = 1` (unchanged)
4. Interface becomes invalid: `interface_.prismaStep = 1` (doesn't match current `prisma.step = 2`)
5. Test and Realize are also invalid (depend on Interface)

Only Prisma and downstream phases are invalidated. Analyze remains valid and doesn't need rerunning.

## State Persistence

### Event Sourcing

AutoBE uses event sourcing to persist state. The state is not stored directly; instead, the event stream is stored, and state is reconstructed by replaying events.

**Location**: `packages/interface/src/events/` - All event definitions

**Key Events for State**:
- `AutoBeAnalyzeCompleteEvent` - Contains complete Analyze history
- `AutoBePrismaCompleteEvent` - Contains complete Prisma history
- `AutoBeInterfaceCompleteEvent` - Contains complete Interface history
- `AutoBeTestCompleteEvent` - Contains complete Test history
- `AutoBeRealizeCompleteEvent` - Contains complete Realize history

Each complete event carries the full history for its phase, including the step counter and all generated artifacts.

### State Reconstruction

**Location**: `packages/agent/src/AutoBeAgent.ts:60-182`

The `AutoBeAgent` class maintains the current state and rebuilds it from events:

```typescript
export class AutoBeAgent {
  private readonly state_: AutoBeState = {
    analyze: null,
    prisma: null,
    interface: null,
    test: null,
    realize: null,
  };

  private readonly histories_: AutoBeHistory[] = [];

  public constructor(props: AutoBeAgent.IProps) {
    // Replay existing histories to rebuild state
    for (const history of props.histories ?? []) {
      this.histories_.push(history);

      if (history.type === "analyze") {
        this.state_.analyze = history;
      } else if (history.type === "prisma") {
        this.state_.prisma = history;
      }
      // ... handle other types
    }
  }
}
```

When a session is loaded, all historical events are replayed in order to reconstruct the exact state at session save time.

## Concurrency and Race Conditions

### Single-Threaded Execution

AutoBE's state machine operates in a single-threaded manner. Only one phase can execute at a time. This prevents race conditions where multiple phases might try to update state simultaneously.

**Implementation**: The facade functions are not concurrent. When a user triggers a phase, it executes to completion before another phase can start.

### Event Ordering

Events are emitted and processed sequentially. The event stream maintains strict ordering, ensuring state transitions are deterministic.

**Location**: `packages/agent/src/AutoBeAgentBase.ts` - Base class for event emission

```typescript
export abstract class AutoBeAgentBase {
  private readonly emitter_: EventEmitter<AutoBeEvent.Mapper> =
    new EventEmitter();

  protected emit<T extends AutoBeEvent.Type>(
    type: T,
    event: AutoBeEvent.Mapper[T]
  ): void {
    this.emitter_.emit(type, event);
  }
}
```

Events are synchronously dispatched to listeners, maintaining order.

## State Queries

### Predicate Functions

**Location**: `packages/agent/src/orchestrate/facade/predicateStateMessage.ts`

Helper functions query state validity:

```typescript
export const predicateAnalyzeComplete = (state: AutoBeState): boolean => {
  return state.analyze !== null;
};

export const predicatePrismaComplete = (state: AutoBeState): boolean => {
  return state.prisma !== null &&
         state.analyze !== null &&
         state.prisma.analyzeStep === state.analyze.step;
};

export const predicateInterfaceComplete = (state: AutoBeState): boolean => {
  return state.interface !== null &&
         state.analyze !== null &&
         state.prisma !== null &&
         state.interface.analyzeStep === state.analyze.step &&
         state.interface.prismaStep === state.prisma.step;
};
```

These predicates are used throughout the codebase to check if phases can execute.

### State Inspection

The current state is queryable at any time:

```typescript
const agent = new AutoBeAgent({ /* ... */ });

// Check if Analyze completed
if (predicateAnalyzeComplete(agent.state())) {
  console.log("Analysis complete:", agent.state().analyze);
}

// Check if ready for Realize
if (predicateTestComplete(agent.state())) {
  // Can proceed with Realize phase
}
```

## Edge Cases and Invariants

### Invariant 1: Step Monotonicity

Step counters only increase, never decrease. This ensures clear versioning without ambiguity.

```typescript
// Correct
analyze.step = 1
// User reruns analyze
analyze.step = 2

// Never happens
analyze.step = 1
analyze.step = 0  // Invalid!
```

### Invariant 2: Step Consistency

A phase's step counter must always be greater than or equal to the step counters it references.

```typescript
// Valid
interface.step = 5
interface.analyzeStep = 3
interface.prismaStep = 4

// Invalid (impossible state)
interface.step = 2
interface.analyzeStep = 5  // Cannot reference future!
```

### Edge Case: Partial Completion

If a phase starts but fails before completing, no complete event is emitted, and state remains unchanged. The phase can be retried without affecting state integrity.

```typescript
// Before: state.prisma = null
await orchestratePrisma();  // Fails with compiler error

// After: state.prisma = null (unchanged)
// Can retry:
await orchestratePrisma();  // Try again
```

### Edge Case: Multiple Modifications

A phase can be rerun multiple times, incrementing its step each time:

```typescript
// First run
analyze.step = 1

// User refines requirements
analyze.step = 2

// User refines again
analyze.step = 3
```

All downstream phases become invalid each time, requiring regeneration.

## State Machine Visualization

```
┌─────────────┐
│   Initial   │
│ (all null)  │
└──────┬──────┘
       │ analyze()
       ▼
┌─────────────┐
│   Analyze   │
│  Complete   │
└──────┬──────┘
       │ prisma()
       ▼
┌─────────────┐
│   Prisma    │
│  Complete   │
└──────┬──────┘
       │ interface()
       ▼
┌─────────────┐
│  Interface  │
│  Complete   │
└──────┬──────┘
       │ test()
       ▼
┌─────────────┐
│    Test     │
│  Complete   │
└──────┬──────┘
       │ realize()
       ▼
┌─────────────┐
│   Realize   │
│  Complete   │
└─────────────┘
```

At any Complete state, the user can modify requirements and rerun an earlier phase, which invalidates all subsequent phases through step counter mismatches.

## Benefits of This Design

1. **Automatic Invalidation**: No manual tracking of what needs regeneration. Step counters handle it automatically.

2. **Clear Dependencies**: Each history explicitly records which versions of prerequisites it was built against.

3. **Reproducibility**: Given a set of histories with step counters, the exact dependency relationships can be reconstructed.

4. **User Flexibility**: Users can modify requirements at any phase and the system automatically determines what needs rerunning.

5. **Type Safety**: All step counters are compile-time checked. TypeScript prevents invalid state assignments.

6. **Debuggability**: Step counters make it trivial to diagnose why a phase is invalid - just compare step numbers.

## Implementation References

**Key Files**:
- `packages/agent/src/context/AutoBeState.ts` - State definition
- `packages/agent/src/orchestrate/facade/transformFacadeStateMessage.ts` - Validation logic
- `packages/agent/src/orchestrate/facade/predicateStateMessage.ts` - Predicate functions
- `packages/interface/src/histories/` - History type definitions with step counters
- `packages/agent/src/factory/createAutoBeApplication.ts` - Facade functions that check state

The step counter pattern is a simple yet powerful mechanism that eliminates complex dependency graphs while ensuring correctness through compile-time type checking.
