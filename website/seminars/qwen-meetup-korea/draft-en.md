# Function Calling All-In: How AutoBe Achieved 100% Compilation Success Rate with Qwen

> Draft for Qwen Meetup Korea

---

### TL;DR

- **Part 1. [AutoBe](https://github.com/wrtnlabs/autobe)** — a backend AI agent built entirely on function calling
  - An open-source AI agent that generates complete backends from natural language conversation
  - The LLM never writes code directly. It fills typed structures via function calling, and compilers convert them to code
  - We shipped a build with the system prompt missing — nobody noticed. Types were the best prompt
  - 100% compilation success rate across all Qwen 3.5 models (down to `qwen3.5-35b-a3b`)
- **Part 2. [Typia](https://github.com/samchon/typia)** — infrastructure that automates the entire function calling lifecycle
  - A single TypeScript type drives schema generation → parsing → type coercion → validation → feedback
  - Even with extremely low raw success rates, Typia's infrastructure pulls them up to 100%
    - `qwen3-coder-next`: 6.75% → 100% (validation feedback)
    - `qwen3.5` series: 0% → 100% (type coercion)
  - Types are schemas, validators, and prompts — all at once
- **Part 3. The Case for Function Calling** — a methodology for domains that demand precision
  - Defining schemas and annotating each field is clearer and mechanically verifiable, compared to natural language prompts
  - No pink elephant problem: constraints through structural absence, not prohibition
  - Model-neutral: same schema, same pipeline, every model works
  - Core formula: Typed Schema + Deterministic Validator + Structured Feedback = Reliable Output
- **Part 4. Why Qwen** — R&D cost, edge case discovery, open ecosystem
  - Local models are essential for thousands of experiment cycles
  - Small models are the best QA engineers — edge case discovery hardens the entire system
  - Open-source (AutoBe) + open-weight (Qwen) virtuous cycle
- **The LLM doesn't need to be accurate — it just needs to be correctable**

---

## Part 1. AutoBe

6.75%.

That's the probability that `qwen3-coder-next` produces a correct result on the first try when asked to generate API data types (input/output structures for products, orders, payments, etc.) for a shopping mall backend. Out of 100 attempts, 93 fail.

Yet AutoBe's final compilation success rate is 100%. Across all four Qwen models.

### What AutoBe Does

[AutoBe](https://github.com/wrtnlabs/autobe) is an open-source AI agent that generates production-ready backends from natural language conversation. It is developed by [Wrtn Technologies](https://wrtn.io).

"Build me a shopping mall backend. I need product registration, shopping cart, orders, and payments." — Say this, and AutoBe generates everything:

- Requirements analysis (SRS)
- Database schema (Prisma ERD)
- API specification (OpenAPI 3.1)
- E2E test code
- Complete implementation code
- Type-safe SDK

And all of this code compiles. You get a working backend built on TypeScript + NestJS + Prisma.

![](https://autobe.dev/images/demonstrate/replay-qwen-qwen3.5-122b-a10b.png)

### The LLM Never Writes Code Directly

Most AI coding agents tell the LLM "write this code" and save the output text directly as source files. AutoBe doesn't work this way.

Instead, AutoBe uses **function calling**. Rather than letting the LLM freely generate text, it asks the LLM to fill in the blanks of a predefined structure (JSON Schema). Think of it as handing over an empty form and saying "fill this in."

When the LLM fills in the form and returns structured data, AutoBe's compiler reads this data and converts it into actual code. **The LLM fills structures; the compiler writes code.**

AutoBe's entire pipeline works this way:

| Phase | What the LLM fills | Compiler validation |
|-------|-------------------|-------------------|
| Requirements | [`AutoBeAnalyzeDocument`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/analyze/AutoBeAnalyzeDocument.ts) — structured SRS | Structure validation |
| Database | [`AutoBeDatabase`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/database/AutoBeDatabase.ts) — Prisma schema structure | Prisma compiler |
| API design | [`AutoBeOpenApi`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) — OpenAPI spec structure | OpenAPI compiler |
| Tests | [`AutoBeTest`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) — 30+ expression types | TypeScript compiler |
| Implementation | Modular code (Collector/Transformer/Operation) | TypeScript compiler |

At every phase, the LLM fills structures and the compiler validates. This is AutoBe's **function calling all-in strategy**.

### What the LLM Has to Fill Is Far from Simple

The "forms" the LLM must fill are anything but trivial. Two examples will give you a sense of the precision required.

First, the **DTO schema type** that the LLM must generate during API design. A DTO (Data Transfer Object) defines the data structures used in API requests and responses — things like "a product's price is a positive integer, its name is a string, and its category list is an array of strings."

The type that defines these DTO schemas is `IJsonSchema`. It's a union of 10 different kinds (constant, boolean, integer, number, string, array, object...), with recursive nesting where arrays contain more `IJsonSchema`:

```typescript
export type IJsonSchema =
  | IJsonSchema.IConstant
  | IJsonSchema.IBoolean
  | IJsonSchema.IInteger
  | IJsonSchema.INumber
  | IJsonSchema.IString
  | IJsonSchema.IArray      // items: IJsonSchema ← recursive
  | IJsonSchema.IObject     // properties: Record<string, IJsonSchema> ← recursive
  | IJsonSchema.IReference
  | IJsonSchema.IOneOf      // oneOf: IJsonSchema[] ← recursive
  | IJsonSchema.INull;
```

10 variants, infinitely deep recursive nesting. The 6.75% mentioned earlier is the raw function calling success rate for this type.

At the test phase, complexity goes up another notch. To generate E2E test code, you need to express logic like "call this API, check that the response status is 200, and verify that the items array length is greater than 0." The type that holds this is `IExpression`:

```typescript
export type IExpression =
  | IBooleanLiteral   | INumericLiteral    | IStringLiteral     // literals
  | IArrayLiteralExpression  | IObjectLiteralExpression          // compound literals
  | INullLiteral      | IUndefinedKeyword                       // null/undefined
  | IIdentifier       | IPropertyAccessExpression               // accessors
  | IElementAccessExpression | ITypeOfExpression                 // access/operations
  | IPrefixUnaryExpression   | IPostfixUnaryExpression           // unary operations
  | IBinaryExpression                                            // binary operations
  | IArrowFunction    | ICallExpression    | INewExpression      // functions
  | IArrayFilterExpression   | IArrayForEachExpression           // array operations
  | IArrayMapExpression      | IArrayRepeatExpression            // array operations
  | IPickRandom       | ISampleRandom      | IBooleanRandom     // random generation
  | IIntegerRandom    | INumberRandom      | IStringRandom      // random generation
  | IPatternRandom    | IFormatRandom      | IKeywordRandom     // random generation
  | IEqualPredicate   | INotEqualPredicate                      // assertion predicates
  | IConditionalPredicate    | IErrorPredicate;                  // assertion predicates
```

Over 30 variants with recursive nesting. This is essentially programming-language-level complexity that the LLM must generate through a single function call.

### Turning 6.75% into 100%

With structures this complex, a 6.75% first-attempt success rate is no surprise. The question is how to turn that 6.75% into 100%.

The secret is a **validation feedback loop** — a cycle of verification, feedback, and correction.

When the LLM fails a function call, it doesn't just get told "wrong." Typia (a library we'll cover in detail later) takes the LLM's original JSON output and inserts `// ❌` inline comments at the exact points where errors occurred:

```json
{
  "schemas": {
    "properties": {
      "type": "str" // ❌ [{"path":"$input.schemas.properties.type","expected":"string & (\"boolean\" | \"number\" | \"string\" | \"object\" | \"array\")"}]
    }
  },
  "product": {
    "price": -100, // ❌ [{"path":"$input.product.price","expected":"number & Minimum<0>"}]
    "quantity": 2.5 // ❌ [{"path":"$input.product.quantity","expected":"number & Type<\"uint32\">"}]
  }
}
```

Next to `"type": "str"`, it says exactly "this is wrong; it should be `boolean`, `number`, `string`, etc." Next to `"price": -100`, it says "must be 0 or greater." Next to `"quantity": 2.5`, it says "must be a positive integer."

With this feedback, the LLM doesn't need to regenerate everything from scratch — it corrects only the flagged fields and retries.

Compiler validation → precise diagnostics → LLM correction → re-validation. This loop repeats until success. Whether it takes one try or ten, it eventually reaches 100%.

### Qwen 3.5: From 0% to 100%

The `qwen3.5` series presents an even more dramatic case.

These models have a peculiarity: when they encounter union types (fields that can hold one of several kinds), they double-stringify objects. In simple terms, they wrap an object that should go inside JSON as a string one extra time:

```json
{
  "payment": "{\"type\":\"card\",\"cardNumber\":\"1234-5678\"}"
}
```

The `payment` field should contain the object `{ type: "card", cardNumber: "1234-5678" }`. But Qwen 3.5 converts this object into a string. It's like putting a letter in an envelope, then putting that envelope inside another envelope.

This caused the raw success rate for all function calls involving union types to be **0%**.

Typia's type coercion solved this. By referencing the JSON Schema, it knows "this field should be an object according to the schema" and automatically parses the stringified value back into the original object:

```typescript
// Before (Qwen 3.5 output):
{ payment: '{"type":"card","cardNumber":"1234-5678"}' }
// After (type coercion applied):
{ payment: { type: "card", cardNumber: "1234-5678" } }
```

The model itself wasn't modified. The model's output was corrected at the infrastructure level. This turned Qwen 3.5's 0% into 100%.

### Four Models, All 100%

AutoBe currently tests with four Qwen models, and all pass compilation.

| Model | Active parameters | Characteristics |
|-------|------------------|----------------|
| `qwen/qwen3-coder-next` | — | Coding-specialized, tool choice support |
| `qwen/qwen3.5-397b-a17b` | 17B / 397B | Largest MoE |
| `qwen/qwen3.5-122b-a10b` | 10B / 122B | Mid-size MoE |
| `qwen/qwen3.5-35b-a3b` | 3B / 35B | Small MoE |

From 397B down to 35B. Even a small model with 3B active parameters generates a complete shopping mall backend. Same pipeline, same schema, same result.

### It Runs Without a System Prompt

Here's an anecdote.

AI agents typically have a system prompt — a document that gives the LLM instructions in natural language, like "You are a backend development expert. Follow these rules when writing code..." In most AI agents, the system prompt is the most critical component.

Once, we shipped a build where the system prompt was entirely missing. It ran on nothing but function calling schemas and validation logic, without any natural language instructions.

Nobody noticed. The output quality was identical.

It wasn't a one-time incident. The same thing happened multiple times, and the result was the same every time.

**Types were the best prompt, and validation feedback was the best orchestration.**

---

## Part 2. Typia — The Infrastructure That Makes All of This Possible

The things that appeared naturally throughout Part 1 — schema conversion, broken JSON recovery, type coercion, precise error feedback — who handles all of that?

Using function calling in production requires solving more than a few problems. How do you generate the JSON Schema to send to the LLM? What do you do when the LLM returns broken JSON? How do you correct wrong types? How do you communicate errors in a form the LLM can understand?

[Typia](https://github.com/samchon/typia) solves all of this in a single library.

### From TypeScript Types to Function Calling Schemas

To use function calling, you first need a JSON Schema that tells the LLM "give me data in this structure." Typically, developers write this schema manually. You define the type, write a corresponding schema separately, and maintain both to keep them in sync.

Typia automates this process. Just define a TypeScript type, and Typia automatically generates the JSON Schema for that type **at compile time**. This isn't runtime reflection — it directly leverages the TypeScript compiler's type analyzer:

```typescript
import typia, { tags } from "typia";

interface IMember {
  /**
   * Member's age.
   *
   * Only adults aged 19 or older can register.
   * This is the platform's legal age restriction.
   */
  age: number & tags.Type<"uint32"> & tags.ExclusiveMinimum<18>;
  email: string & tags.Format<"email">;
  name: string & tags.MinLength<1> & tags.MaxLength<100>;
}

const schema = typia.llm.parameters<IMember>();
// {
//   type: "object",
//   properties: {
//     age: {
//       type: "integer",
//       description: "Member's age.\n\nOnly adults aged 19 or older can register.\nThis is the platform's legal age restriction.",
//       exclusiveMinimum: 18
//     },
//     email: { type: "string", format: "email" },
//     name: { type: "string", minLength: 1, maxLength: 100 }
//   },
//   required: ["age", "email", "name"]
// }
```

Two things are worth noting here.

First, **JSDoc comments are converted to `description`.** The LLM reads this description to decide what values to generate. Since "Only adults aged 19 or older can register" is automatically included in the schema, the LLM can understand the context and generate appropriate values.

Second, **type constraints become validation rules.** `ExclusiveMinimum<18>` becomes a validation rule meaning "greater than 18," and `Format<"email">` becomes an email format validation rule. A single type definition produces both the LLM guide and the validation rules simultaneously.

When schemas are written manually, type and schema inevitably drift apart over time. Typia eliminates this problem at its root. **Types are schemas.**

At the class level, `typia.llm.application<T>()` converts all public methods into function calling schemas, with `parse()`, `coerce()`, and `validate()` methods automatically built into each function.

### Lenient JSON Parsing: Handling the Broken JSON That LLMs Produce

LLMs don't produce perfect JSON. Why? Because an LLM is a language model that generates text token by token — it's not a JSON generator. It forgets to close brackets, misplaces commas, prepends explanations like "Here is your answer:" before the JSON, and wraps it in Markdown code blocks.

`JSON.parse()` rejects all of these inputs. Typia's `ILlmFunction.parse()` handles every case:

| Problem type | Example | Handling |
|-------------|---------|---------|
| Unclosed bracket | `{"name": "John"` | Auto-close |
| Trailing comma | `[1, 2, 3, ]` | Ignore |
| JavaScript comments | `{"a": 1 /* comment */}` | Remove |
| Unquoted keys | `{name: "John"}` | Allow |
| Incomplete keyword | `{"done": tru` | Complete as `true` |
| Prefix explanation text | `Here is your JSON: {"a": 1}` | Skip |
| Markdown code block | `` ```json\n{"a": 1}\n``` `` | Extract inner content |

In real LLM output, multiple problems occur simultaneously:

```typescript
const llmOutput = `
  > I'd be happy to help you with your order!
  \`\`\`json
  {
    "order": {
      "payment": "{\\"type\\":\\"card\\",\\"cardNumber\\":\\"1234-5678",
      "product": {
        name: "Laptop",
        price: "1299.99",
        quantity: 2,
      },
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        vip: tru
  \`\`\` `;

const result = func.parse(llmOutput);
// Markdown code block, prefix text, unquoted keys, trailing comma,
// double stringify, string→number, incomplete keyword, unclosed bracket
// — 7 problems at once, all handled by a single parse() call.
```

### Schema-Based Type Coercion: Correction That Knows the Schema

LLMs frequently get not just JSON structure wrong, but types too. They put string `"42"` where number `42` is expected, and string `"true"` where boolean `true` is expected. A human sees the same meaning, but from a program's perspective, these are completely different types.

Simple type casting can't solve this. Whether `"42"` should be a number or a string can only be determined by knowing whether the field's schema expects `number` or `string`.

Typia's `ILlmFunction.coerce()` references the JSON Schema and automatically converts to the type the schema expects:

| LLM output | Schema expected type | Conversion result |
|-----------|---------------------|-------------------|
| `"42"` | `number` or `integer` | `42` |
| `"true"` / `"false"` | `boolean` | `true` / `false` |
| `"null"` | `null` | `null` |
| `"{\"x\": 1}"` | `object` | `{ x: 1 }` (recursive parsing) |
| `"[1, 2, 3]"` | `array` | `[1, 2, 3]` (recursive parsing) |

Here's what it looks like in practice:

```typescript
const fromLlm = {
  order: {
    payment: '{"type":"card","cardNumber":"1234-5678"}',  // double stringify
    product: {
      name: "Laptop",
      price: "1299.99",     // string but schema expects number
      quantity: "2",        // string but schema expects integer
    },
    customer: {
      name: "John Doe",
      vip: "true",          // string but schema expects boolean
    },
  },
};

const result = func.coerce(fromLlm);
// result.order.product.price === 1299.99      (number)
// result.order.product.quantity === 2          (integer)
// result.order.customer.vip === true           (boolean)
// result.order.payment === { type: "card", cardNumber: "1234-5678" }  (object)
```

For discriminated unions (structures where one of several types is selected), it uses `x-discriminator` to select the correct variant and then applies that variant's coercion rules.

**This is the mechanism that achieved the 0% → 100% for the Qwen 3.5 series introduced in Part 1.** The problem of models double-stringifying objects in union types was solved at the infrastructure level using schema information.

When an SDK has already parsed the JSON (Anthropic SDK, Vercel AI, LangChain, MCP, etc.), use `coerce()` instead of `parse()`.

https://typia.io/docs/llm/application/#lenient-json-parsing

### Validation and Precise Feedback

Even after parsing and type coercion, values themselves can be wrong. A negative price, a string that isn't an email format, or a decimal where an integer is expected.

Typia's `ILlmFunction.validate()` detects these schema violations and pinpoints not just "it's wrong" but **the exact location and cause**:

```typescript
const result = func.validate(input);
// Error example:
// {
//   path: "$input.order.product.price",
//   expected: "number & Minimum<0>",
//   value: -100
// }
```

"The price inside product inside order should be a number ≥ 0, but you gave -100" — that's the level of precision.

And `LlmJson.stringify()` inserts these errors as `// ❌` inline comments on top of the original JSON the LLM returned:

```json
{
  "order": {
    "payment": {
      "type": "card",
      "cardNumber": 12345678 // ❌ [{"path":"$input.order.payment.cardNumber","expected":"string"}]
    },
    "product": {
      "name": "Laptop",
      "price": -100, // ❌ [{"path":"$input.order.product.price","expected":"number & Minimum<0>"}]
      "quantity": 2.5 // ❌ [{"path":"$input.order.product.quantity","expected":"number & Type<\"uint32\">"}]
    },
    "customer": {
      "email": "invalid-email", // ❌ [{"path":"$input.order.customer.email","expected":"string & Format<\"email\">"}]
      "vip": "yes" // ❌ [{"path":"$input.order.customer.vip","expected":"boolean"}]
    }
  }
}
```

The LLM can see at a glance where and why it went wrong, right on top of the JSON it sent. With this feedback, it doesn't need to rewrite everything — it just corrects the 5 flagged fields and retries.

### The Full Loop: Parse → Coerce → Validate → Feedback → Retry

Combining everything introduced so far into a single loop completes the full picture of the validation feedback loop shown in Part 1:

```typescript
async function callWithFeedback(
  llm: LLM,
  func: ILlmFunction,
  prompt: string,
  maxRetries: number = 10,
): Promise<unknown> {
  let feedback: string | null = null;

  for (let i = 0; i < maxRetries; i++) {
    // 1. Request function call from LLM (including previous feedback)
    const rawOutput = await llm.call(prompt, feedback);

    // 2. Lenient JSON parsing + Type coercion
    const parsed = func.parse(rawOutput);
    if (!parsed.success) {
      feedback = `JSON parsing failed: ${JSON.stringify(parsed.errors)}`;
      continue;
    }

    // 3. Schema validation
    const validated = func.validate(parsed.data);
    if (!validated.success) {
      // 4. Generate structured feedback (// ❌ inline comment format)
      feedback = LlmJson.stringify(validated);
      continue;
    }

    // 5. Success
    return validated.data;
  }
  throw new Error("Max retries exceeded");
}
```

`parse()` rescues broken JSON and performs first-pass type correction. `validate()` catches schema violations. `LlmJson.stringify()` renders the errors in a form the LLM can read. The LLM reads this feedback and corrects. **This is the complete engine that turns 6.75% into 100%.**

### Why Not Zod?

Zod is the most popular runtime validation library in the TypeScript ecosystem. "Why don't you use Zod?" is a question we get often.

Here's what happens when you try to define 30+ variant recursive discriminated unions like AutoBe's in Zod:

```typescript
const ExpressionSchema: z.ZodType<IExpression> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("booleanLiteral"), value: z.boolean() }),
    z.object({
      type: z.literal("callExpression"),
      expression: ExpressionSchema,         // circular reference
      arguments: z.array(ExpressionSchema),  // circular reference
    }),
    // ... 28 more
  ])
);
```

Several problems emerge. With `z.lazy()`, `z.infer` can't infer the TypeScript type, so you have to define the type separately. Deep recursion causes the TypeScript type checker to halt with "infinite recursive type" errors. You end up maintaining TypeScript interfaces and Zod schemas in parallel, and over time they drift apart.

With Typia, a single TypeScript interface is all you need:

```typescript
const result = typia.validate<AutoBeTest.IExpression>(llmOutput);
```

It works at the compiler level, so it handles types of any complexity. No separate schema definition needed.

### One Type Does Everything

In summary, define a single TypeScript type and Typia handles the rest:

1. **Generates schemas** — `typia.llm.parameters<T>()`, `typia.llm.application<T>()`
2. **Parses** — `ILlmFunction.parse()` (broken JSON recovery + type coercion)
3. **Coerces** — `ILlmFunction.coerce()` (type coercion for SDK-parsed objects)
4. **Validates** — `ILlmFunction.validate()` (schema violation detection)
5. **Generates feedback** — `LlmJson.stringify()` (`// ❌` inline diagnostics for the LLM)

**Types are schemas, validators, and prompts — all at once.**

---

## Part 3. The Case for Function Calling

So far, through AutoBe and Typia, we've seen **how** function calling works. From here, we'll discuss **why** function calling is an effective methodology in domains that demand precision and accuracy.

### Natural Language and Types

Natural language is a naturally occurring language. It evolved organically over thousands of years in human society, and ambiguity is a feature. Metaphor, nuance, politeness, humor — all run on ambiguity. The strength of natural language is that "just handle it appropriately" actually works.

Programming languages are designed languages. Someone deliberately created them to eliminate room for interpretation. "Appropriately" doesn't compute. Ambiguity is a bug.

**When people communicate in natural language, they misunderstand each other and argue. When they communicate through types and design, there is no misunderstanding.**

Let's contrast LLM prompts with type schemas.

Conveying constraints through prompts:
> "The age field must be a positive integer greater than 18. Do not use string types for numeric fields. All required fields must be present..."

Several problems are visible. It's unclear whether "greater than 18" means >18 or ≥18. There's no way to know whether the LLM followed these rules until you inspect the result. And as schemas get more complex, rules like these multiply endlessly.

Conveying constraints through types:
```typescript
interface IMember {
  /** Only adults aged 19 or older can register */
  age: number & Type<"uint32"> & ExclusiveMinimum<18>;
}
```

`ExclusiveMinimum<18>`, so >18. It's an integer. It's a required field. Clear, and mechanically verifiable.

In domains where accurate results are needed, defining schemas and annotating each field is far clearer and easier than writing natural language prompts — and mechanically verifiable on top of that.

### The Pink Elephant Problem

Anyone who has built a prompt-based AI agent has experience writing prohibition rules:

- "Do not create utility functions"
- "Do not use the `any` type"
- "Do not create circular dependencies"

Just as hearing "don't think of a pink elephant" makes you think of a pink elephant, telling an LLM "don't do X" places X at the center of its attention. To avoid a forbidden pattern, it must first recall that pattern — which actually increases the probability of generating the forbidden pattern. This problem is inherent to the token prediction mechanism.

Even knowing this, you can't avoid prohibition rules in prompts. Because "don't do ~" is the only way to express constraints in natural language. In practice, I've never seen a prompt-based AI agent without prohibition rules.

**In schemas, this problem doesn't exist.**

You don't need to say "don't use `any`" — if `any` isn't in the schema, the LLM physically cannot generate it. You don't need to say "don't create utility functions" — if there's no utility function slot in the schema, that's the end of it. If a field type is limited to `"boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"` — just 7 options — there's no path for the LLM to write `"varchar"`.

Not prohibition, but **absence**. Prompts try to forbid what you don't want; schemas permit only what you do want. This is why function calling is particularly effective in domains that require precise output.

### Model Neutrality

Prompt engineering is inherently model-dependent. A prompt optimized for GPT behaves differently on Claude and differently again on Qwen. When a new model comes out or you want to experiment with a different model, it's not uncommon to have to rewrite prompts from scratch.

Function calling schemas are model-neutral. JSON Schema is JSON Schema. It means the same thing regardless of which model reads it, and performance differences between models are absorbed by the validation feedback loop. A strong model gets it right in 1-2 tries; a weak model takes 10-15, but both converge to 100%.

AutoBe running Qwen, GLM, DeepSeek, and OpenAI models with the **same schema, same pipeline** and achieving 100% compilation across all of them is proof of this neutrality. We've never done model-specific prompt tuning.

This changes the nature of model selection. It transforms from a capability question — "Can this model do this task?" — into a **cost optimization problem**: `average retries × tokens per attempt × price per token`.

### The Core: Verifiability and Feedback Loops

One core idea runs through everything discussed so far.

The most powerful advantage of function calling is that **it brings LLM output into the domain of software engineering**.

When you let an LLM generate free text, determining whether that output is right or wrong becomes yet another AI problem. Parsing is fuzzy, validation is fuzzy, correction is fuzzy. Everything is uncertain.

With function calling, the output is structured data. From that moment, you can use software engineering tools:

1. **Verification is deterministic** — JSON Schema validation has a clear right/wrong
2. **Feedback is precise** — it pinpoints "field X should be type Y but you gave Z"
3. **Correction converges** — with precise feedback, the model can fix just the affected parts

These three form a deterministic chain. The model still makes probabilistic errors, but **the loop outside the model is deterministic**, so it converges to 100%.

> **Typed Schema + Deterministic Validator + Structured Error Feedback = Reliable LLM Output**

If prompt engineering is an approach that tries to nudge the inside of the model, function calling is an approach that makes the outside of the model robust. In domains that require precision, the effectiveness of the latter has been proven by the 6.75% → 100% result.

**The LLM doesn't need to be accurate. It just needs to be correctable. And correctability is not a property of the model — it's a property of the validation infrastructure.**

### Application Spectrum: How Far Can This Go?

So can this pattern — function calling + validation feedback — only be used for coding? No. It forms a spectrum based on verifiability.

#### Domains Where All Output Can Be Verified

AutoBe's Database, Interface, Test, and Realize phases fall here. The compiler serves as the validator, guaranteeing 100% correctness.

This isn't just about software. Any field where "right/wrong" can be mechanically determined can use the same structure, and a natural hierarchy exists based on verification cost:

| Domain | Fast (ms) | Medium (sec) | Deep (min+) |
|--------|----------|-------------|------------|
| Software | Type check | Compilation | Test execution |
| Semiconductors | DRC | LVS | SPICE simulation |
| Accounting | Arithmetic check | Account code validity | Regulatory audit |
| Law | Structure validation | Logical consistency | Jurisdiction rules |

The feedback loop naturally leverages this hierarchy: run the cheapest validator first, fix errors, then move to the next level.

#### Domains Where Abstraction and Correctness Coexist

In reality, the space between "fully verifiable" and "not verifiable at all" is much wider. This is the pattern where part of the output is left free-form while another part is strictly verified.

AutoBe's Analyze phase (requirements analysis generation) is this case. The SRS structure is verified by types, but content quality can't be fully verified. Yet just constraining the structure provides sufficient value. This isn't a hypothesis — it's what AutoBe already does.

This pattern is portable to other domains. Here are some examples expressed as types.

**Law** — AI freely develops legal arguments, but conclusions are classified in a structured form:

```typescript
interface ILegalAnalysis {
  reasoning: string;                 // Abstract: AI develops arguments freely
  applicableClauses: IClause[];      // Verified: classify clauses by type
  classification: ILegalCategory;    // Verified: legal classification
}

interface IClause {
  type: "obligation" | "condition" | "warranty" | "indemnity"
      | "termination" | "confidentiality" | "limitation";
  title: string;
  description: string;
  subclauses: IClause[];  // recursive structure
}
```

`reasoning` is free text, so it's not validated. But the existence of clauses and the validity of `type` classification are deterministically verifiable. A reviewer doesn't need to read the entire argument — just check "does this clause actually belong in this classification?"

**Accounting** — Financial statements are a set of deterministic rules:

```typescript
interface ILineItem {
  account_code: string & Pattern<"^[0-9]{4}$">;
  description: string;
  amount: number;
  classification: "current_asset" | "non_current_asset"
    | "current_liability" | "non_current_liability"
    | "equity" | "revenue" | "expense";
}
```

Balance sheet equilibrium (assets = liabilities + equity), account code validity, subtotal arithmetic. All can be made into validators. Even if AI freely writes the `description`, whether amounts balance and account codes are valid can be verified instantly.

**Semiconductors** — Physical rules in chip design are non-negotiable:

```typescript
interface IChipLayout {
  technology_node: "5nm" | "7nm" | "14nm" | "28nm";
  blocks: IBlock[];
  connections: IConnection[];
}

interface IBlock {
  type: "logic" | "memory" | "io" | "analog" | "pll";
  position: IPoint2D;
  dimensions: IDimension;
  sub_blocks: IBlock[];  // recursive hierarchy
}
```

DRC (Design Rule Check, fast), LVS (Layout vs Schematic, medium), SPICE simulation (slow). Costs differ by stage, but all are deterministic verification. The feedback loop runs the cheapest DRC first.

**Medical** — Diagnoses can be structured as decision trees:

```typescript
type IDecisionNode =
  | IDecisionNode.ITest
  | IDecisionNode.IDiagnosis
  | IDecisionNode.IBranch;

namespace IDecisionNode {
  export interface IDiagnosis {
    type: "diagnosis";
    icd_code: string & Pattern<"^[A-Z][0-9]{2}(\\.[0-9]{1,4})?$">;
    confidence: number & Minimum<0> & Maximum<1>;
    recommended_treatment: string;
  }

  export interface IBranch {
    type: "branch";
    condition: string;
    if_true: IDecisionNode;   // recursive
    if_false: IDecisionNode;  // recursive
  }
}
```

ICD code (International Classification of Diseases) validity, decision tree completeness (no dead ends), clinical guideline compliance. The medical soundness of the diagnostic logic itself requires expert judgment, but structural correctness is mechanically verifiable.

---

To be honest, I'm a developer, not a domain expert in these fields. I can't guarantee 100%. But the core logic is the same: **if a domain has rules that determine right from wrong, this pattern is applicable.** Just as AutoBe proved this with coding and compilers, I believe this pattern is portable to any field where logic and verifiability exist.

#### Domains Where It Doesn't Apply

Conversely, this pattern doesn't fit domains where deterministic validators can't be built. Creative writing, emotion, strategic decision-making. There's no validator for "a good novel" or "a wise business decision." This I acknowledge honestly.

---

## Part 4. Why Qwen

### R&D Cost: The Difference Between Users and Developers

For customers **using** AutoBe, model cost isn't an issue. No matter how expensive the model, it's cheaper than actually hiring a backend developer.

But for us **developing** AutoBe, it's different. Every time we design a new type or add new validation logic, we need to run the entire pipeline end to end. Thousands of generate-compile-feedback cycles. Using commercial models every time would bankrupt us.

Local models make this R&D cycle possible. We can experiment without limits, without worrying about cost. Getting from 6.75% to 100% required hundreds of experiment cycles — and that was only possible because they were local models.

### Small Models Are the Best QA Engineers

Large models make fewer mistakes. This is an advantage, but also a disadvantage.

Even when there are validation blind spots we hadn't thought of, large models rarely trigger those failures. They "guess appropriately" through ambiguous parts of the schema. Our mistakes stay hidden.

With 35B-class small models, it's a different story. Counterexamples pour out:

| Model | Success rate | What it found |
|-------|-------------|--------------|
| `qwen3-30b-a3b-thinking` | ~10% | Fundamental schema ambiguities, missing required fields |
| `qwen3-next-80b-a3b-instruct` | ~20% | Subtle type mismatches in complex nested relationships |

A 10% success rate was the most valuable result. Every failure pointed to a gap in our system, and each fix strengthened the pipeline for **all models**, not just the weak ones.

AI is probabilistic. Large models make **fewer** mistakes — not **zero**. The counterexamples that surface with small models will also trigger once in a while with large models. In production, "once in a while" means an outage.

**When schemas become precise enough that even a 35B model can't misinterpret them, the probability of a stronger model getting it wrong converges to virtually zero.**

### No Vendor Lock-In

Pricing changes, model deprecation, rate limits for commercial APIs — all at the vendor's discretion. The model you use today could disappear tomorrow.

AutoBe's function calling schemas are designed to be model-neutral. We don't use prompt tricks optimized for specific models. JSON Schema and type-based validation are industry standards, and the code stays the same even when models change.

### Open-Source + Open-Weight: A Virtuous Cycle in an Open Ecosystem

AutoBe is open-source (AGPL 3.0), and Qwen is open-weight. Both are open ecosystems.

This combination is what made thousands of experiments possible, what made edge case discovery possible, what made system hardening possible. With commercial models, experimentation at this scale would have been financially impossible.

An open ecosystem creates a virtuous cycle where each side strengthens the other:
- AutoBe hardens its system with Qwen
- The hardened system proves Qwen's production-level viability
- Qwen's improvements raise AutoBe's overall performance
- AutoBe's discoveries (like the double-stringify issue) can contribute to Qwen's improvement

---

## Closing

AutoBe achieved 100% compilation success rate across all four Qwen models through its function calling all-in strategy.

What made this possible wasn't a smarter prompt or more sophisticated orchestration. It was the type-based infrastructure provided by Typia — automatic schema generation, lenient parsing, type coercion, validation feedback — deterministically overcoming the model's probabilistic limitations.

When you speak in types, there is no misunderstanding. When you constrain with schemas, there are no pink elephants. When you have a deterministic validation loop, even 6.75% becomes 100%.

This pattern is not limited to coding. It can be ported to any field where logic and correctness exist.

And what made all of this experimentation and validation possible was Qwen, an open-weight model.

The LLM doesn't need to be accurate. It just needs to be correctable.

---

**About AutoBe**: [AutoBe](https://github.com/wrtnlabs/autobe) is an open-source AI agent developed by [Wrtn Technologies](https://wrtn.io). It generates production-ready backend applications from natural language.

**About Typia**: [Typia](https://github.com/samchon/typia) is a compiler library that automatically generates runtime validators, JSON Schema, and function calling schemas from TypeScript types.
