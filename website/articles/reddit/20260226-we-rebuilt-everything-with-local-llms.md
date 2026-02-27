# [AutoBe] We Built an AI That Writes Full Backend Apps — Then Broke Its 100% Success Rate on Purpose with Weak Local LLMs

## TL;DR

- [AutoBe](https://github.com/wrtnlabs/autobe) = open-source AI agent generating complete backend apps (TypeScript + NestJS + Prisma)
- Had 100% compilation success, but the code was **unmaintainable** — no code reuse meant every small change required regenerating everything
- Rebuilt around modular code generation → success rate crashed to 40%
- **Small local LLMs became our best debugging tools** — exposed every schema ambiguity stronger models papered over
- Shifted from prompt engineering → **schema design + validation feedback**
- **6.75% raw function calling success → 100% through validation feedback alone**
- Back to 100% with GLM v5, other local models climbing

Links:
- GitHub: https://github.com/wrtnlabs/autobe
- Examples: https://github.com/wrtnlabs/autobe-examples
- Full Article: https://dev.to/samchon/autobe-we-built-an-ai-that-writes-full-backend-apps-then-broke-its-100-success-rate-on-purpose-5757

---

## Why I Disappeared

Hey r/LocalLLaMA, I'm back.

Some of you might remember me posting monthly benchmarks of various local models on AutoBe. I disappeared for a few months. Here's why.

We had "perfect" metrics — 100% compilation, near-100% runtime. Then we tried using AutoBe for actual commercial projects and discovered the code was **disposable**. Our architecture generated every API endpoint as a self-contained unit with no shared code. Adding one field meant regenerating 50 independent implementations.

So we rebuilt everything around modular code generation. **Success rate immediately cratered to 40%.**

---

## How Local LLMs Saved the Rebuild

The new architecture introduced dependencies between modules. Suddenly the AI had to understand relationships, type compatibility, interface contracts. The margin for error vanished.

**How do you find bugs you don't know exist? Throw intentionally weak models at it.**

| Model | Success Rate | What It Exposed |
|-------|-------------|-----------------|
| `qwen3-30b-a3b-thinking` | ~10% | AST schema ambiguities, malformed structures |
| `qwen3-next-80b-a3b-instruct` | ~20% | Type mismatches, edge cases in nested relationships |

That ~10% success rate was **gold**. Each fix didn't just help the weak model — it tightened the entire system. When a schema is precise enough that a 30B model can't misinterpret it, a strong model will never get it wrong.

This is also why local LLMs matter for cost: discovering edge cases requires hundreds of generation-compile-diagnose cycles. At cloud API prices, that's prohibitive.

---

## From Prompts to Schemas

We stripped system prompts to almost nothing. Moved all constraints into function calling schemas. Let validation feedback do the teaching.

AutoBe uses three AST types — arguably the hardest structures for LLMs to generate:

- [AutoBeDatabase](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/database/AutoBeDatabase.ts) — Prisma models, relations, indexes
- [AutoBeOpenApi](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) — OpenAPI schemas, endpoints, DTOs
- [AutoBeTest](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) — 30+ expression types

Why hard? **Unlimited union types + unlimited depth + recursive references:**

```typescript
// Compiler AST = the hardest type structure possible
export type IExpression =
  | IBooleanLiteral
  | IStringLiteral
  | IArrayLiteralExpression   // <- recursive (contains IExpression[])
  | IObjectLiteralExpression  // <- recursive
  | IBinaryExpression         // <- recursive (left & right)
  | ICallExpression           // <- recursive (args are IExpression[])
  | IConditionalPredicate     // <- recursive (then & else branches)
  | ... // 30+ expression types total
```

`qwen3-coder-next`'s raw function calling success: **6.75%**. Yet with validation feedback, it reaches **100%**:

```json
{
  "age": "twenty", // ❌ expected: number
  "email": "not-an-email", // ❌ expected: string & Format<"email">
}
```

The LLM reads this and self-corrects. We accidentally shipped builds with NO system prompt — output quality was indistinguishable. Types beat prose.

---

## Current Benchmarks (Local LLMs Only)

Compilation success in the final realize phase:

| Model | todo | bbs | reddit | shopping |
|-------|------|-----|--------|----------|
| `z-ai/glm-5` | 100% | 100% | 100% | 100% |
| `deepseek/deepseek-v3.1-terminus-exacto` | 100% | 87% | 99% | 100% |
| `qwen/qwen3-coder-next` | 100% | 100% | 96% | 92% |
| `qwen/qwen3-next-80b-a3b-instruct` | 95% | 94% | 88% | 91% |
| `qwen/qwen3-30b-a3b-thinking` | 96% | 90% | 71% | 79% |

**Limitations**: Only GLM v5 has recovered to 100%. Runtime success (E2E tests) still hasn't fully recovered — that's next. But every schema fix benefits all models at once.

---

In the next article, I'll break down exactly how validation feedback turns 6.75% into 100%.

How to design function calling schemas for compiler AST with 30+ node types, and how to build feedback loops that make even weak models self-correct. Practical enough to apply to your own local LLM projects.

Happy to answer questions.
