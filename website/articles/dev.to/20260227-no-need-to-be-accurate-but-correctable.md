<!--
[AutoBe] LLMs Don't Need to Be Accurate. They Need to Be Correctable.
-->

**How typed schemas and validation feedback took AutoBe from 6.75% to 100% — and why this changes everything about building AI agents.**

---

In [my previous article](https://dev.to/samchon/autobe-we-built-an-ai-that-writes-full-backend-apps-then-broke-its-100-success-rate-on-purpose-5757), I ended with a promise: to break down exactly how validation feedback turns a 6.75% raw success rate into 100% — how to design function calling schemas for structures as complex as a compiler's AST with 30+ node types, and how to build feedback loops that make even weak models self-correct.

This is that article. Not an academic paper — I don't have time for controlled experiments and p-values, and honestly, I don't have the interest either. What I have is years of building [typia](https://github.com/samchon/typia) and [AutoBe](https://github.com/wrtnlabs/autobe), and watching this pattern work across models, across schema complexities, and across domains I never originally designed it for.

Take what's useful. Leave what isn't.

---

## The Number That Started Everything

Let me begin with the number that changed my thinking.

When we benchmarked AutoBe against `qwen3-coder-next` — an open-source LLM — we asked it to generate DTO schemas for a shopping mall backend. These schemas involve deeply nested types, recursive structures, and discriminated unions with 30+ variants.

The raw function calling success rate was **6.75%**.

That means roughly 93 out of every 100 attempts were structurally invalid. Not "kind of wrong" — invalid. Wouldn't parse. Wouldn't compile.

But the pipeline's final output? **100% correct.** Every run. Without exception.

The only thing standing between 6.75% and 100% was validation feedback: validate the LLM's output against a typed schema, tell it exactly what's wrong, and let it try again.

That's it. No prompt engineering tricks. No RAG. No multi-agent evaluation chains. In fact, we once accidentally shipped a build with the **entire system prompt missing**, and nobody noticed — the output quality was indistinguishable. The types and validation feedback were doing all the work the system prompt was supposed to do.

This experience crystallized something I'd been circling around for years: **the question isn't how to make LLMs right. It's how to make it okay for them to be wrong.**

---

## The Pattern, Stripped to Its Essentials

Here's what the feedback loop looks like:

1. **Define the output as a typed schema.** Not a natural language description — a real type that a machine can validate.
2. **Let the LLM fill it.** It will probably fail. That's fine.
3. **Validate deterministically.** A real validator — not another LLM — checks the output.
4. **Feed structured errors back.** Not "something's wrong." Exactly what's wrong: the path, the expected type, the actual value.
5. **Repeat until valid.**

```typescript
// The validator tells the LLM exactly what went wrong
{
  path: "$input.schemas[3].properties[2].type",
  expected: 'string & ("boolean" | "number" | "string" | "object" | "array")',
  value: "str"  // LLM wrote "str" instead of "string"
}
```

The LLM doesn't need to be right on the first try. It needs to be **correctable**. And correctability is a property of your validation infrastructure, not your model.

Simple enough in theory. But the devil is in the details — specifically, in how you design the schemas and how you structure the feedback. So let me show you what this actually looks like in practice.

---

## Why Types Beat Prompts

Before I get into the schemas, I want to address something that keeps coming up: people writing elaborate system prompts and wondering why their agents are unreliable.

Here's the prompt approach:

> "The age field must be a positive integer greater than 18. Do not use string types for numeric fields. Ensure all required fields are present. Do not include additional properties not defined in the schema..."

This is ambiguous (does "greater than 18" mean >18 or ≥18?), unverifiable (how do you check the LLM followed it?), and scales terribly (your prompt grows linearly with your schema complexity).

Now here's the type approach with typia:

```typescript
interface IMember {
  /**
   * Member's age.
   *
   * Only adults who are at least 19 years old may sign up.
   * This is a legal age restriction enforced by the platform.
   */
  age: number & Type<"uint32"> & ExclusiveMinimum<18>;
}
```

The JSDoc comment guides the LLM's generation. The type constraints enforce correctness. If the LLM writes `age: "twenty"`, the validator catches it instantly and tells the LLM exactly what went wrong. No interpretation needed.

And with typia, you don't maintain types and validators separately — the validator is generated directly from the type at compile time:

```typescript
import typia from "typia";

const result = typia.validate<IMember>(llmOutput);
if (!result.success) {
  // Feed result.errors back to LLM for correction
  // Each error has: path, expected, value
}
```

The type IS the schema IS the validator IS the prompt. One source of truth. That's why the system prompt was redundant — the function calling schemas were already doing everything the prompt was supposed to do, except without the ambiguity.

With that foundation in place, let me walk you through the actual schemas AutoBe uses. The complexity is the point.

---

## Inside AutoBe: The Schemas That Make It Work

### Database Schema (Prisma ERD)

When AutoBe designs a database, the LLM doesn't write raw Prisma schema files. It fills a typed AST:

```typescript
export namespace AutoBeDatabase {
  export interface IApplication {
    files: IFile[];
  }

  export interface IFile {
    /**
     * Name of the Prisma schema file.
     *
     * Organize files by business domain: "actors" for users/members,
     * "sales" for products/pricing, "orders" for transactions, etc.
     * Typically 8-10 files for a full e-commerce application.
     */
    name: string;

    /**
     * Description of this schema file's business domain.
     *
     * Write multiple paragraphs explaining:
     * 1. What business concepts this file covers
     * 2. How these concepts relate to other domains
     * 3. Key business rules reflected in the schema
     */
    description: string;

    tables: ITable[];
  }

  export interface ITable {
    name: string;
    description: string;
    columns: IColumn[];
    indexes: IIndex[];
  }

  export interface IColumn {
    name: string;
    description: string;
    type: "boolean" | "int" | "bigint" | "float" | "string"
        | "text" | "uuid" | "datetime" | "json";
    nullable: boolean;
    default?: string;
  }
  // ... relations, indexes, etc.
}
```

Notice the JSDoc comments — they're not decoration. They're the prompt. The LLM reads these when deciding what to generate. The type constraints ensure the output is structurally valid. Then the compiler that processes this AST generates actual Prisma schema files and validates them with the Prisma compiler.

If the LLM sets a column type to `"varchar"` (not in the union), the validator catches it. If it forgets a required `description`, the validator catches it. If the generated Prisma schema has an invalid relation, the Prisma compiler catches it. At every level, the error is exact and actionable.

### OpenAPI Specification

After the database is designed, AutoBe generates the API specification. Again, not raw OpenAPI YAML — a typed AST:

```typescript
export namespace AutoBeOpenApi {
  export interface IDocument {
    operations: IOperation[];
    schemas: Record<string, IJsonSchema>;
  }

  export interface IOperation {
    /**
     * HTTP method for this operation.
     *
     * Use GET for retrieval, POST for creation,
     * PUT for full update, PATCH for partial update,
     * DELETE for removal. Follow REST conventions strictly.
     */
    method: "get" | "post" | "put" | "patch" | "delete";

    /**
     * URL path with parameter placeholders.
     *
     * Use kebab-case for path segments.
     * Use {parameter_name} syntax for path parameters.
     * Example: "/shopping/sellers/{seller_id}/products/{product_id}"
     */
    path: string;

    description: string;
    parameters: IParameter[];
    requestBody?: IJsonSchema;
    responseBody: IJsonSchema;
  }

  // JSON Schema types — here's where it gets recursive
  export type IJsonSchema =
    | IJsonSchema.IBoolean
    | IJsonSchema.IInteger
    | IJsonSchema.INumber
    | IJsonSchema.IString
    | IJsonSchema.IArray
    | IJsonSchema.IObject
    | IJsonSchema.IReference
    | IJsonSchema.IOneOf
    | IJsonSchema.INull;

  export namespace IJsonSchema {
    export interface IObject {
      type: "object";
      description: string;
      properties: Record<string, IJsonSchema>;  // recursive
      required: string[];
    }
    export interface IArray {
      type: "array";
      description: string;
      items: IJsonSchema;  // recursive
    }
    export interface IOneOf {
      oneOf: IJsonSchema[];  // recursive union
      description: string;
    }
    // ... other variants
  }
}
```

This is where most validation libraries start to struggle. `IJsonSchema` is a recursive discriminated union — an object whose properties are themselves `IJsonSchema`, which can be arrays whose items are `IJsonSchema`, and so on, infinitely deep. With typia, it's just a TypeScript interface. The compiler handles the rest.

### Test Code AST

This is the most complex schema in AutoBe — and the one that best illustrates why this pattern works at any complexity level.

The LLM doesn't write TypeScript test code directly. It constructs an AST that gets compiled into test code:

```typescript
export namespace AutoBeTest {
  export type IExpression =
    | ILiteralExpression       // "hello", 42, true
    | IIdentifierExpression    // variableName
    | IPropertyAccessExpression // obj.prop
    | IBinaryExpression        // a + b, x === y
    | ICallExpression          // func(arg1, arg2)
    | IArrayExpression         // [1, 2, 3]
    | IObjectExpression        // { key: value }
    | IConditionalExpression   // a ? b : c
    | IApiOperateExpression    // HTTP API call
    | IArrayMapExpression      // arr.map(x => ...)
    | IArrayForEachExpression  // arr.forEach(x => ...)
    // ... 30+ variants total

  export type IStatement =
    | IVariableStatement       // const x = expr
    | IExpressionStatement     // expr;
    | IIfStatement             // if (cond) { ... } else { ... }
    | IReturnStatement         // return expr
    // ...

  export interface ICallExpression {
    type: "callExpression";
    callee: IExpression;       // recursive
    arguments: IExpression[];  // recursive
  }

  export interface IIfStatement {
    type: "ifStatement";
    condition: IExpression;
    then: IStatement[];        // recursive
    else?: IStatement[];       // recursive
  }
}
```

30+ expression variants, recursive at every level, discriminated unions nested inside discriminated unions. The LLM is essentially constructing a program — but in a structured format where every single node can be validated before any code is generated.

And with `qwen3-coder-next`'s 6.75% raw accuracy, the validation feedback loop brings this to 100%.

If it works here, it works on anything you'll ever need. And that realization is what led me to think beyond code.

---

## Beyond Code: Where This Pattern Actually Leads

Here's the thing — code was just where I happened to apply this pattern first, because compilers are the ultimate validators. But there's nothing code-specific about the formula:

> **Typed schema + Deterministic validator + Structured error feedback = Reliable LLM output**

This works in any domain where two conditions hold:

1. **The output is expressible as a typed schema.** If you can describe the structure of valid output as a type, you're in.
2. **A deterministic validator exists.** Something — not another LLM — can check correctness and report exactly what's wrong.

Once I started looking, I realized these conditions are met almost everywhere. Most engineering domains already have formal specification formats and validation toolchains. They just haven't been connected to LLMs through typed feedback loops.

Let me show you what this looks like across several domains.

### Interior Design: Furniture Placement

```typescript
interface IPlacement {
  room: IRoom;
  items: IFurnitureInstance[];
}

interface IRoom {
  /** Width in millimeters */
  width: number & Type<"uint32"> & Minimum<1000>;
  /** Height in millimeters */
  height: number & Type<"uint32"> & Minimum<1000>;
  walls: IWall[];
  openings: IOpening[];
}

interface IOpening {
  type: "door" | "window" | "archway";
  wall_index: number;
  /** Position along wall in mm from wall start */
  position: number & Type<"uint32">;
  /** Width of opening in mm */
  width: number & Type<"uint32"> & Minimum<600>;
}

interface IFurnitureInstance {
  catalog_id: string;
  position: IPoint2D;
  rotation: 0 | 90 | 180 | 270;
}
```

**Validators:**
- Collision detection: AABB overlap → `{ path: "items[2]", error: "overlaps items[5] by 120mm at (3200, 4100)" }`
- Circulation: pathfinding with 800mm minimum width → `{ path: "room.circulation", error: "no path from opening[0] to opening[2]" }`
- Wall clearance: furniture-to-wall distance → `{ path: "items[1]", error: "15mm from wall[2], minimum is 50mm" }`

The LLM doesn't need to understand spatial geometry. It just needs to respond to "item 2 overlaps item 5 by 120mm" by moving item 2. That's a far easier task than getting the placement right on the first try.

### Legal Document: Contract Clause Structure

```typescript
interface IContract {
  parties: IParty[];
  clauses: IClause[];
}

interface IClause {
  type: "obligation" | "condition" | "warranty" | "indemnity"
      | "termination" | "confidentiality" | "limitation";
  title: string;
  description: string;
  conditions: ICondition[];
  subclauses: IClause[];  // recursive
}

type ICondition =
  | ICondition.ITemporal     // "within 30 days of..."
  | ICondition.IMonetary     // "exceeding $10,000..."
  | ICondition.IConditional  // "if Party A fails to..."
  | ICondition.IConjunction; // AND/OR combinations

namespace ICondition {
  export interface IConjunction {
    type: "conjunction";
    operator: "and" | "or";
    operands: ICondition[];  // recursive
  }
}
```

**Validators:** structural completeness, logical consistency, regulatory compliance checks.

### Accounting: Financial Statement Structure

```typescript
interface IFinancialStatement {
  type: "balance_sheet" | "income_statement" | "cash_flow";
  period: IPeriod;
  sections: ISection[];
}

interface ISection {
  name: string;
  line_items: ILineItem[];
  subtotal: number;
  subsections: ISection[];  // recursive
}

interface ILineItem {
  account_code: string & Pattern<"^[0-9]{4}$">;
  description: string;
  amount: number;
  classification: "current_asset" | "non_current_asset"
    | "current_liability" | "non_current_liability"
    | "equity" | "revenue" | "expense";
}
```

**Validators:** balance equation (assets = liabilities + equity), account code validity, XBRL compliance, arithmetic checks on subtotals.

### Semiconductor: Block-Level Layout

```typescript
interface IChipLayout {
  technology_node: "5nm" | "7nm" | "14nm" | "28nm";
  blocks: IBlock[];
  connections: IConnection[];
}

interface IBlock {
  type: "logic" | "memory" | "io" | "analog" | "pll";
  name: string;
  position: IPoint2D;
  dimensions: IDimension;
  sub_blocks: IBlock[];  // recursive hierarchy
}

interface IConnection {
  source: IBlockReference;
  target: IBlockReference;
  /**
   * Signal type determines routing constraints.
   * Clock signals require matched-length routing.
   * Power signals require wider traces.
   */
  signal_type: "data" | "clock" | "power" | "ground";
}
```

**Validators:** DRC (fast), LVS (medium), timing analysis (slower), power analysis (slowest) — each level progressively more expensive.

### Medical: Diagnostic Decision Tree

```typescript
type IDecisionNode =
  | IDecisionNode.ITest
  | IDecisionNode.IDiagnosis
  | IDecisionNode.IBranch;

namespace IDecisionNode {
  export interface ITest {
    type: "test";
    test_name: string;
    outcomes: IOutcome[];
  }

  export interface IOutcome {
    result: string;
    next: IDecisionNode;  // recursive
  }

  export interface IBranch {
    type: "branch";
    condition: string;
    if_true: IDecisionNode;   // recursive
    if_false: IDecisionNode;  // recursive
  }

  export interface IDiagnosis {
    type: "diagnosis";
    icd_code: string & Pattern<"^[A-Z][0-9]{2}(\\.[0-9]{1,4})?$">;
    confidence: number & Minimum<0> & Maximum<1>;
    recommended_treatment: string;
  }
}
```

**Validators:** ICD code validity, diagnostic logic (no dead ends, all branches reachable), clinical guideline compliance.

---

## The Validator Hierarchy

You'll notice every domain above has validators at multiple levels of cost. This isn't coincidence — it mirrors what we already do in software:

| Domain | Fast (ms) | Medium (sec) | Deep (min+) |
|--------|----------|-------------|------------|
| Software | Type check | Compile | Run tests |
| Interior | Collision | Circulation | (Aesthetics — human) |
| Semiconductor | DRC | LVS | SPICE sim |
| Architecture | Geometry | Code compliance | FEM structural |
| Accounting | Arithmetic | Account validity | Regulatory audit |
| Law | Structural | Logical consistency | Jurisdiction rules |

The feedback loop exploits this hierarchy naturally: run the cheapest validator first, fix those errors, then move to the next level. This keeps each iteration fast even when deep validation is expensive.

---

## A Common Question: Why Not Zod?

People always ask this, so let me address it directly.

Zod is a great library for simple schemas. But every domain example above involves recursive discriminated unions — and that's where Zod breaks down:

```typescript
// Trying to define AutoBeTest.IExpression in Zod:
const ExpressionSchema: z.ZodType<IExpression> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("literal"), value: z.any() }),
    z.object({
      type: z.literal("call"),
      callee: ExpressionSchema,      // circular reference
      arguments: z.array(ExpressionSchema), // circular reference
    }),
    // ... 28 more variants
  ])
);
```

The problems compound quickly:
1. **`z.infer` doesn't work with `z.lazy()`** — you end up defining the TypeScript type separately, defeating the "single source of truth" promise
2. **IDE performance tanks** — TypeScript's type checker struggles with deeply recursive Zod types, often throwing "infinite recursive type" errors
3. **You maintain two things** — the TypeScript interface AND the Zod schema, which drift apart over time
4. **Scale breaks it** — 30+ variant unions with recursive nesting is painful to write, read, and debug

With typia, you just write the TypeScript interface. That's it. The validation code is generated at compile time by reading the type directly from the TypeScript compiler:

```typescript
// This is the entire validation setup for AutoBe's 30+ variant recursive AST:
const result = typia.validate<AutoBeTest.IExpression>(llmOutput);
```

One source of truth, no duplication, no IDE issues — and it handles any level of type complexity because it operates at the compiler level, not the type inference level.

For simple `{ name: string, age: number }` schemas, the difference between Zod and typia is negligible. The gap becomes a chasm when your types look like the real-world domain models I showed above. And as I hope those examples made clear — real-world domains are *always* recursive trees.

---

## The Model Matters Less Than You Think

One more thing I want to be clear about: this pattern makes the choice of LLM far less important than people assume.

In our benchmarks, the difference between a strong model (GPT-4o, Claude) and a weak model (qwen3-coder-next) isn't "works vs. doesn't work." It's **fewer feedback rounds vs. more feedback rounds.** The strong model might get it right in 1-2 tries. The weak model might need 10-15. But both converge to 100%.

The exception is models too weak to respond to feedback at all — they keep making the same mistakes in a loop. But that threshold is surprisingly low. If a model can do basic function calling, it can probably be corrected into producing valid output.

This turns model selection into a straightforward cost calculation: `average_rounds × tokens_per_round × token_price`. A cheaper model with more rounds might cost less than an expensive model with fewer rounds. The feedback loop reduces model choice from a capability question to a cost optimization problem.

---

## What I'm Not Claiming

I want to be honest about the limits, because overpromising helps no one.

**Structural correctness ≠ Semantic correctness.** This pattern guarantees that output matches the schema. It doesn't guarantee business sense. A furniture placement can pass collision and circulation checks while being ugly. A database schema can be valid Prisma while having bad normalization. A contract clause tree can be structurally sound while containing terrible legal advice.

But this is the same as saying "code that compiles isn't necessarily correct." True — and yet compilation is still enormously valuable. It eliminates an entire class of errors, freeing you to focus on the harder, more interesting ones.

What we found in AutoBe is that structural correctness gets you surprisingly far. When the LLM isn't wasting its capacity fighting structural constraints, it actually does a better job on the semantic level too. The types act as guardrails that channel output toward valid territory, and within that territory, the model's judgment turns out to be reasonable.

---

## Just Try It

I built typia because I needed validation that scaled with type complexity without maintaining duplicate schemas. I built AutoBe because I wanted to see how far the pattern could go. The answer — turning 6.75% into 100% on compiler-grade ASTs — surprised even me.

The domain examples in this article — interior design, law, accounting, semiconductor, medical — aren't hypothetical. They're straightforward applications of the same pattern AutoBe uses in production, just with different types and different validators.

If you're building AI agents that need to produce structured, validated output:

1. **Start with [typia](https://typia.io)** — `npm install typia`
2. **Define your domain as TypeScript types** with JSDoc comments that guide LLM generation
3. **Use `typia.validate()`** to get structured errors
4. **Feed those errors back** to your LLM in a retry loop
5. **Watch your success rate climb** from whatever it starts at toward 100%

The types are the prompt. The validator is the teacher. The LLM is a surprisingly willing student.

You just need to give it the right feedback.

---

*[typia](https://github.com/samchon/typia) — TypeScript runtime validators from pure type definitions*
*[AutoBe](https://github.com/wrtnlabs/autobe) — AI agent for generating complete backend applications*
*[@typia/mcp](https://typia.io/docs/llm/mcp/) — Model Context Protocol integration*