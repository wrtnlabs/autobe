# Agent Histories

## History Philosophy

AutoBE agents need context to perform their tasks. This context is provided through message history - the sequence of messages sent to the LLM before the agent's actual task instruction.

History is not just "previous conversation". It's carefully curated context that gives the agent exactly what it needs to succeed, nothing more, nothing less. Too little context and the agent lacks information. Too much context wastes tokens and dilutes important information.

History Transformers are functions that construct optimal message histories for each agent. They analyze the current state, extract relevant information, and format it into clear messages. This is a critical optimization point - good history design dramatically improves output quality and reduces costs.

## History Transformation

Each agent has a dedicated History Transformer function that builds its context.

**Input**: Current AutoBE state (analysis results, Prisma schema, OpenAPI doc, test results, compilation diagnostics, etc.)

**Output**: Array of messages in Claude API format (`{role: 'user' | 'assistant', content: string}`)

**Location**: `packages/agent/src/orchestrate/*/histories/*` - colocated with orchestrators

The transformer selects what information to include based on the agent's task. An agent generating Prisma schema needs the requirements analysis but doesn't need test results. An agent fixing TypeScript errors needs the code and error messages but doesn't need the original requirements.

Transformers use intelligent filtering and summarization to keep context lean while preserving essential information.

## Message Types

Histories consist of different message types, each serving a specific purpose.

### Context Messages

Context messages provide background information that doesn't change across similar tasks. They're perfect for Prompt Caching.

**Examples**:
- Requirements analysis report
- Prisma schema
- OpenAPI specification
- Project structure and conventions

Context messages go early in history to maximize cache reuse. They're marked with `cache_control` to signal Claude to cache them.

### Task-Specific Messages

Task-specific messages vary per task. They contain the specific input for this particular agent invocation.

**Examples**:
- "Generate implementation for the `getUser` operation"
- "Fix the following TypeScript errors: ..."
- "Review this analysis report for completeness"

Task messages go after context messages. They're short and specific, building on the cached context.

### Example Messages

Example messages show the agent "how to think" through concrete demonstrations. They're especially powerful for few-shot learning.

**Pattern**: User provides example input, assistant provides example output. This shows the exact transformation the agent should perform.

Example messages are included in context (for caching) since they don't change across tasks. The actual task message then follows the same pattern.

### Correction Feedback

When an agent's output fails compilation or review, correction feedback explains what went wrong.

**Contents**:
- Compiler error messages
- Diagnostic locations and severity
- Suggested fixes
- Previous attempt for reference

Correction agents receive this feedback as their primary input. They analyze errors and produce fixes.

## Content Formatting

History content is formatted for maximum clarity and LLM comprehension.

### Structured Sections

Large content is divided into named sections with clear headers:

```
## Requirements Analysis

[analysis content]

## Prisma Schema

[schema content]

## Your Task

Generate API specifications based on the above.
```

Sections make content scannable. The LLM can quickly locate relevant information.

### Code Blocks

All code is wrapped in markdown code blocks with language tags:

````
```typescript
function example() {
  return "code here";
}
```
````

This improves LLM comprehension and output formatting. The LLM learns to format its own code output similarly.

### JSON Formatting

Structured data is formatted as readable JSON with proper indentation:

```json
{
  "entity": "User",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "email", "type": "string"}
  ]
}
```

Pretty-printed JSON is easier for LLMs to parse and understand.

### Clarity Over Brevity

Histories prioritize clarity over token conservation (up to a point). Clear explanations and well-formatted content help the LLM understand context accurately.

However, irrelevant verbosity is removed. Don't include information the agent won't use.

## Optimization Strategies

Effective history optimization balances context quality and token efficiency.

### Selective Inclusion

Only include information the agent actually needs. Ask: "Will the agent use this to perform its task?"

**Example**: Realize Write agent generating controller code needs:
- ✅ OpenAPI operation specification
- ✅ Prisma schema (to understand available data)
- ✅ DTO type definitions
- ❌ Original user requirements (too abstract)
- ❌ Test code (not relevant to implementation)

This keeps context focused and reduces token usage.

### Summarization

Long documents are summarized to essential points. Full details are included only when necessary.

**Example**: Requirements analysis might be 5000 tokens. For Prisma Schema generation, summarize to key entities and relationships (500 tokens). Include full details only if the agent needs them.

Summarization is lossy but intentional. Include what matters for the task.

### Reference Instead of Repeat

When the same information appears in multiple contexts, reference it instead of repeating.

**Example**: If Prisma schema is cached, don't include it again in every message. The LLM retains context across messages.

However, critical information is repeated if it ensures the agent doesn't miss it.

### Incremental Context

For iterative tasks (like error correction), provide incremental context showing progression.

**Example**: Correction agent receives:
- Original code (context)
- First error and fix attempt (context)
- Current error (task)

This shows the agent what's been tried and prevents repeating failed approaches.

## Prompt Caching Strategy

Prompt Caching is critical for cost optimization in AutoBE. History design directly impacts cache effectiveness.

### Cache Block Design

Cache blocks are ~1024 tokens. Structure history so stable content aligns with cache block boundaries.

Messages sent with `cache_control: {type: "ephemeral"}` are cached. Subsequent requests with identical prefix reuse the cache.

**Strategy**:
1. Put stable, reusable content first (requirements, schemas, examples)
2. Mark these messages for caching
3. Put task-specific content last (varies per request)

This maximizes cache hits since the prefix is consistent.

### Cache Reuse Patterns

**Sequential Pattern**: First task in a batch runs cold (no cache), establishing cache. Subsequent tasks reuse cache, running fast and cheap.

AutoBE exploits this by processing similar tasks in batches. First Realize Write operation caches the Prisma schema and OpenAPI spec. Remaining operations reuse this cache.

**Parallel Pattern**: Multiple concurrent tasks use the same cache if they share history prefix. All tasks benefit from caching immediately.

However, parallel tasks must be careful not to invalidate each other's caches by varying the prefix.

### Cache Invalidation

Cache is invalidated when the prefix changes even slightly. A single character difference breaks the cache.

**Avoid**:
- Timestamps in context
- Random IDs or ordering
- Conditional content that varies unpredictably

**Maintain**:
- Deterministic message ordering
- Stable content formatting
- Consistent schema representations

### Cache Monitoring

Monitor cache hit rates to verify optimization effectiveness. Low hit rates indicate prefix instability.

Metrics to track:
- Cache hit rate percentage
- Cache read tokens vs. new tokens
- Cost savings from caching

High cache hit rates (>80%) confirm good history design.

## Stage-Specific Patterns

Different pipeline stages have characteristic history patterns.

### Analyze Stage

Analyze agents receive user requirements as primary input. History is minimal:
- System prompt with analysis framework
- User requirements
- Examples of good analysis

No prior artifacts exist yet, so history is short. Cache benefit is small since requirements vary per project.

### Database Stage

Database agents receive requirements analysis. History includes:
- Requirements analysis (cached)
- Data modeling principles and examples (cached)
- Specific generation task (not cached)

Cache reuse is high since analysis is the same for all schema generation tasks in a project.

### Interface Stage

Interface agents receive both requirements and Prisma schema. History includes:
- Requirements analysis (cached)
- Prisma schema (cached)
- API design principles and examples (cached)
- Specific operation to implement (not cached)

Heavy caching since multiple operations share the same context.

### Test Stage

Test agents receive all prior artifacts. History includes:
- Requirements summary (cached)
- Prisma schema (cached)
- OpenAPI specification (cached)
- Testing guidelines and examples (cached)
- Specific test to generate (not cached)

Maximum cache reuse - test generation benefits heavily from caching.

### Realize Stage

Realize agents receive complete context for implementation. History includes:
- Prisma schema (cached)
- OpenAPI operation (cached)
- DTO types (cached)
- Implementation guidelines and code examples (cached)
- Specific file to generate (not cached)

Realize stage processes dozens of files with shared context. Caching is critical for performance and cost.

### Correction Stages

Correction agents receive error diagnostics. History includes:
- Original artifact (context)
- Error messages (task-specific)
- Correction guidelines (cached if reused)

Correction history is smaller since it focuses on specific errors rather than full project context.

## History Debugging

When agent output is wrong, history is often the culprit. Debug systematically.

### Verify Context Availability

Check that the agent receives all information it needs. Print the actual history and verify required context is present.

**Symptom**: Agent produces generic/wrong output.
**Diagnosis**: Missing context - agent is guessing instead of using facts.
**Fix**: Update History Transformer to include missing information.

### Check Context Clarity

Verify that context is formatted clearly and unambiguously. Is the Prisma schema valid? Are examples correct?

**Symptom**: Agent output is confused or contradictory.
**Diagnosis**: Ambiguous or incorrect context.
**Fix**: Improve formatting, fix errors in context.

### Detect Context Overload

Too much context dilutes important information. The LLM might miss key details buried in noise.

**Symptom**: Agent ignores important constraints or makes basic mistakes.
**Diagnosis**: Critical information lost in large context.
**Fix**: Summarize or remove less important context. Put critical info near the end (recency bias).

### Alignment with Prompts

History must align with System Prompts. If the prompt says "refer to the Prisma Schema below", the history must actually include a section titled "Prisma Schema".

**Symptom**: Agent seems confused about task or context structure.
**Diagnosis**: Prompt-history mismatch.
**Fix**: Coordinate prompt and history transformer changes.

## Best Practices

### Provide What's Needed, Nothing More

Include exactly what the agent needs. More context isn't always better - it can be worse.

### Format for Clarity

Use headers, code blocks, and structure. Make content scannable and clear.

### Cache Aggressively

Design history for maximum cache reuse. Stable prefix, consistent formatting.

### Test with Real Data

Don't assume history is correct - test it. Run agents with the actual history and verify output quality.

### Iterate Based on Failures

When agents fail, check if history can be improved. Add missing context, clarify ambiguities, provide better examples.

### Document History Logic

Explain why each piece of context is included. Future maintainers need to understand the reasoning.

---

History Transformers are unsung heroes of AutoBE. They quietly ensure agents have perfect context, enabling high-quality output with minimal cost. Invest time in history design - it's as important as prompt design.
