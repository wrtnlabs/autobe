# Function Calling All-In: How AutoBe Achieved 100% Compilation Success with Qwen

> Draft for Qwen Meetup Korea

---

### TL;DR

1. [AutoBe](https://github.com/wrtnlabs/autobe)
   - A backend AI agent built entirely on function calling
   - The LLM never writes code — it fills typed structures, and the compiler converts them to code
   - 100% compilation success across all 4 Qwen models
2. [Typia](https://github.com/samchon/typia)
   - Infrastructure that automates the entire function calling lifecycle
   - Schema generation → lenient parsing → type coercion → validation feedback
   - qwen3-coder-next: 6.75% → 100%, qwen3.5 series: 0% → 100%
3. The Case for Function Calling
   - A methodology for domains that demand precision
   - Constraints through structural absence, model-neutral, mechanically verifiable
4. Why Qwen
   - Local models are essential for R&D
   - Small models make the best QA engineers
   - Open ecosystem
5. The LLM doesn't need to be accurate — it just needs to be correctable

---

## 1. AutoBe

6.75%.

That's the probability that `qwen3-coder-next` produces a valid result on its first attempt when asked to generate API data types (input/output structures for products, orders, payments, etc.) for a shopping mall backend. Out of 100 tries, 93 fail.

And yet AutoBe's final compilation success rate is 100%. Across all four Qwen models.

### 1.1. What AutoBe Does

[AutoBe](https://github.com/wrtnlabs/autobe) is an open-source AI agent that generates production-ready backends from natural language conversation. It's developed by [Wrtn Technologies](https://wrtn.io).

"Build me a shopping mall backend. I need product listings, a shopping cart, orders, and payments." — Say this, and AutoBe generates all of the following:

- Requirements analysis (SRS)
- Database schema (Prisma ERD)
- API specification (OpenAPI 3.1)
- E2E test code
- Complete implementation code
- Type-safe SDK

Every line of generated code compiles. What comes out is a real, working backend built on TypeScript + NestJS + Prisma.

![](https://autobe.dev/images/demonstrate/replay-qwen-qwen3.5-122b-a10b.png)

### 1.2. The LLM Never Writes Code Directly

Most AI coding agents tell the LLM "write this code," then save whatever text it outputs straight to a source file. AutoBe doesn't work that way.

Instead, AutoBe uses **function calling**. Rather than letting the LLM generate freeform text, it hands the LLM a predefined structure (a JSON Schema) and says "fill in the blanks." Think of it as giving someone a form and asking them to complete it.

Once the LLM fills in the form and returns structured data, AutoBe's compiler reads that data and converts it into actual code. **The LLM fills structures; the compiler writes code.**

The entire pipeline works this way:

| Phase | What the LLM fills | Compiler validation |
|-------|-------------------|-------------------|
| Requirements | [`AutoBeAnalyze`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/analyze/AutoBeAnalyze.ts) — structured SRS | Structure check |
| Database | [`AutoBeDatabase`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/database/AutoBeDatabase.ts) — Prisma schema structure | Prisma compiler |
| API design | [`AutoBeOpenApi`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) — OpenAPI spec structure | OpenAPI compiler |
| Tests | [`AutoBeTest`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) — 30+ expression types | TypeScript compiler |
| Implementation | Modular code (Collector/Transformer/Operation) | TypeScript compiler |

At every phase, the LLM fills a structure, and a compiler validates it. This is AutoBe's **all-in function calling strategy**.

### 1.3. What the LLM Has to Fill Is Far from Simple

The "forms" the LLM has to fill are anything but trivial. Two examples will give you a sense of the precision required.

First, the **DTO schema type** that the LLM must generate during API design. A DTO (Data Transfer Object) describes the data structures in API requests and responses — things like "a product's price is a positive integer, its name is a string, and its category list is an array of strings."

The type that defines these DTO schemas is `IJsonSchema`. It's a union of 10 distinct kinds (constant, boolean, integer, number, string, array, object...) with recursive nesting — arrays contain more `IJsonSchema`, objects map to more `IJsonSchema`:

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

10 variants, infinitely recursive nesting. The 6.75% figure from earlier? That's the raw function calling success rate for this exact type.

The test phase takes complexity up another level. To generate E2E test code, the LLM has to express logic like "call this API, check that the response status is 200, verify that the body's items array has length greater than 0." The type that captures this is `IExpression`:

```typescript
export type IExpression =
  | IBooleanLiteral   | INumericLiteral    | IStringLiteral     // literals
  | IArrayLiteralExpression  | IObjectLiteralExpression          // compound literals
  | INullLiteral      | IUndefinedKeyword                       // null/undefined
  | IIdentifier       | IPropertyAccessExpression               // accessors
  | IElementAccessExpression | ITypeOfExpression                 // access/ops
  | IPrefixUnaryExpression   | IPostfixUnaryExpression           // unary ops
  | IBinaryExpression                                            // binary ops
  | IArrowFunction    | ICallExpression    | INewExpression      // functions
  | IArrayFilterExpression   | IArrayForEachExpression           // array ops
  | IArrayMapExpression      | IArrayRepeatExpression            // array ops
  | IPickRandom       | ISampleRandom      | IBooleanRandom     // random generation
  | IIntegerRandom    | INumberRandom      | IStringRandom      // random generation
  | IPatternRandom    | IFormatRandom      | IKeywordRandom     // random generation
  | IEqualPredicate   | INotEqualPredicate                      // assertions
  | IConditionalPredicate    | IErrorPredicate;                  // assertions
```

Over 30 variants, recursively nested. This is essentially programming-language-level complexity, and the LLM must generate it through a single function call.

### 1.4. How 6.75% Becomes 100%

Given structures this complex, a 6.75% first-attempt success rate is no surprise. The real question is how to turn 6.75% into 100%.

The answer is a **validation feedback loop** — a cycle of verification, feedback, and correction.

When a function call fails, the system doesn't just say "wrong." Typia (a library we'll cover in detail shortly) takes the LLM's raw JSON output and inserts `// ❌` inline annotations at every exact point where an error occurred. Here's an example from [Typia's documentation](https://typia.io/docs/llm/application/#validation-feedback):

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
      "name": "John Doe",
      "email": "invalid-email", // ❌ [{"path":"$input.order.customer.email","expected":"string & Format<\"email\">"}]
      "vip": "yes" // ❌ [{"path":"$input.order.customer.vip","expected":"boolean"}]
    }
  }
}
```

`cardNumber` should be a string, not a number. `price` must be ≥ 0. `quantity` must be a positive integer. `email` isn't a valid email. `vip` should be a boolean. Five errors, each with the exact path and expected type.

With this feedback, the LLM doesn't need to regenerate everything from scratch. It can precisely correct only the flagged fields and retry.

Compiler validation → precise diagnostics → LLM correction → revalidation. This loop repeats until it succeeds. Whether it takes one attempt or ten, the end result is 100%.

### 1.5. Qwen 3.5: From 0% to 100%

The `qwen3.5` series presents an even more dramatic case.

Here's a function calling application from [Typia's documentation](https://typia.io/docs/llm/application/#lenient-json-parsing):

```typescript
interface IOrder {
  payment: IPayment;
  product: {
    name: string;
    price: number & tags.Minimum<0>;
    quantity: number & tags.Type<"uint32">;
  };
  customer: {
    name: string;
    email: string & tags.Format<"email">;
    vip: boolean;
  };
}
type IPayment =
  | { type: "card"; cardNumber: string }
  | { type: "bank"; accountNumber: string };
```

And here's what the LLM actually returns:

```typescript
const llmOutput = `
  > I'd be happy to help you with your order! 😊
  \`\`\`json
  {
    "order": {
      "payment": "{\\"type\\":\\"card\\",\\"cardNumber\\":\\"1234-5678",
      "product": {
        name: "Laptop",
        price: 1300,
        quantity: 2,
      },
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        vip: tru
  \`\`\``;
```

Markdown wrapping, explanation prefix, unquoted keys, trailing commas, `tru` instead of `true`, unclosed brackets — and `payment` is double-stringified because `IPayment` is an `anyOf`. Seven problems in a single output.

The double-stringify is the one that makes success rate **0%**. Other errors are occasional; `anyOf` double-stringify is **100% consistent** — every `anyOf` field, every time. This isn't Qwen-specific; Anthropic's Claude models do the same thing with `oneOf`. Every model family has its union-type blind spot.

Typia's `parse()` handles all of this in a single call — broken JSON recovery, type coercion, double-stringify unwrapping. No changes to the model. This is how Qwen 3.5 went from 0% to 100%.

### 1.6. Four Models, All at 100%

AutoBe currently tests against four Qwen models. All of them pass compilation.

| Model | Active parameters | Characteristics |
|-------|-----------------|-----------------|
| `qwen/qwen3-coder-next` | — | Coding-focused, tool choice support |
| `qwen/qwen3.5-397b-a17b` | 17B / 397B | Largest MoE |
| `qwen/qwen3.5-122b-a10b` | 10B / 122B | Mid-size MoE |
| `qwen/qwen3.5-35b-a3b` | 3B / 35B | Compact MoE |

From 397B down to 35B. Even a compact model with just 3B active parameters can generate a complete shopping mall backend. Same pipeline, same schemas, same results.

### 1.7. It Runs Without System Prompts

One anecdote.

AI agents typically have system prompts — documents that instruct the LLM in natural language: "You are a backend development expert. Follow these rules when writing code..." In most AI agents, the system prompt is the crown jewel.

Once, we shipped a build where the system prompt was completely missing. The agent ran on nothing but function calling schemas and validation logic. No natural language instructions whatsoever.

Nobody noticed. Output quality was identical.

This wasn't a one-time fluke. It happened multiple times, and the result was the same every time.

**The types were the best prompt, and validation feedback was the best orchestration.**

---

## 2. Typia — The Infrastructure Behind All of This

The things that kept appearing naturally throughout Section 1 — schema conversion, broken JSON recovery, type coercion, precise error feedback — who does all of that?

To use function calling in production, there's no shortage of problems to solve. How do you generate the JSON Schema to send to the LLM? What do you do when the LLM returns broken JSON? How do you correct wrong types? How do you communicate errors in a format the LLM can understand?

[Typia](https://github.com/samchon/typia) handles all of this in a single library.

### 2.1. From TypeScript Types to Function Calling Schemas

Function calling requires a JSON Schema that tells the LLM "give me data in this structure." Normally, developers write these schemas by hand — define the type, write a matching schema separately, then make sure the two don't drift apart over time.

Typia automates this. Define a TypeScript type, and Typia **automatically generates** its JSON Schema **at compile time**. Not through runtime reflection, but by directly leveraging the TypeScript compiler's type analyzer:

```typescript
import typia, { tags } from "typia";

interface IMember {
  /**
   * The member's age.
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
//       description: "The member's age.\n\nOnly adults aged 19 or older can register.\nThis is the platform's legal age restriction.",
//       exclusiveMinimum: 18
//     },
//     email: { type: "string", format: "email" },
//     name: { type: "string", minLength: 1, maxLength: 100 }
//   },
//   required: ["age", "email", "name"]
// }
```

Two things to note here.

First, **JSDoc comments become `description` fields.** The LLM reads these descriptions to decide what values to generate. "Only adults aged 19 or older can register" is automatically included in the schema, giving the LLM the context it needs.

Second, **type constraints become validation rules.** `ExclusiveMinimum<18>` becomes a "> 18" validation rule; `Format<"email">` becomes an email format check. A single type definition produces both LLM guidance and validation rules simultaneously.

When schemas are written by hand, they inevitably drift from the types over time. Typia eliminates this problem entirely. **The type is the schema.**

At the class level, `typia.llm.application<T>()` converts all public methods into function calling schemas, with `parse()`, `coerce()`, and `validate()` methods automatically built into each function.

### 2.2. Lenient JSON Parsing: Cleaning Up the LLM's Broken JSON

LLMs don't produce perfect JSON. Why? Because an LLM is a language model that generates text token by token — not a JSON generator. It forgets to close brackets, misplaces commas, prepends "Here is your answer:" before the JSON, and wraps everything in Markdown code blocks.

`JSON.parse()` rejects all of these. Typia's `ILlmFunction.parse()` handles every case:

| Problem | Example | Resolution |
|---------|---------|-----------|
| Unclosed bracket | `{"name": "John"` | Auto-close |
| Trailing comma | `[1, 2, 3, ]` | Ignore |
| JavaScript comments | `{"a": 1 /* comment */}` | Strip |
| Unquoted keys | `{name: "John"}` | Allow |
| Incomplete keywords | `{"done": tru` | Complete to `true` |
| Explanation prefix | `Here is your JSON: {"a": 1}` | Skip |
| Markdown code block | `` ```json\n{"a": 1}\n``` `` | Extract inner |

In real LLM outputs, these problems occur simultaneously:

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
// Markdown code block, explanation prefix, unquoted keys, trailing commas,
// double-stringify, string→number, incomplete keyword, unclosed brackets
// — 8 problems at once, all handled by a single parse() call.
```

### 2.3. Schema-Based Type Coercion: Correction That Knows the Schema

LLMs frequently get types wrong, not just structure. They write `"42"` (a string) where `42` (a number) is expected, and `"true"` (a string) where `true` (a boolean) is expected. A human would see these as equivalent, but to a program they're completely different types.

Naive type casting can't solve this. Whether `"42"` should be a number or remain a string depends entirely on whether the schema for that field says `number` or `string`.

Typia's `ILlmFunction.coerce()` consults the JSON Schema and converts values to the type the schema expects:

| LLM output | Expected type | Result |
|-----------|--------------|--------|
| `"42"` | `number` or `integer` | `42` |
| `"true"` / `"false"` | `boolean` | `true` / `false` |
| `"null"` | `null` | `null` |
| `"{\"x\": 1}"` | `object` | `{ x: 1 }` (recursive parsing) |
| `"[1, 2, 3]"` | `array` | `[1, 2, 3]` (recursive parsing) |

Here's what this looks like in practice:

```typescript
const fromLlm = {
  order: {
    payment: '{"type":"card","cardNumber":"1234-5678"}',  // double-stringify
    product: {
      name: "Laptop",
      price: "1299.99",     // string, but schema says number
      quantity: "2",        // string, but schema says integer
    },
    customer: {
      name: "John Doe",
      vip: "true",          // string, but schema says boolean
    },
  },
};

const result = func.coerce(fromLlm);
// result.order.product.price === 1299.99      (number)
// result.order.product.quantity === 2          (integer)
// result.order.customer.vip === true           (boolean)
// result.order.payment === { type: "card", cardNumber: "1234-5678" }  (object)
```

For discriminated unions (structures where one of several types is selected), `x-discriminator` identifies the correct variant first, then applies that variant's coercion rules.

**This is the mechanism behind the Qwen 3.5 series' 0% → 100% from Section 1.** The model's tendency to double-stringify objects in union types was solved at the infrastructure level using schema information.

When the SDK has already parsed the JSON (Anthropic SDK, Vercel AI, LangChain, MCP, etc.), use `coerce()` instead of `parse()`.

### 2.4. Validation and Precise Feedback

Even after parsing and type coercion, the values themselves can be wrong. A negative number for a price, a non-email string in an email field, a decimal where an integer is required.

Typia's `ILlmFunction.validate()` detects these schema violations and pinpoints not just that something is wrong, but **exactly where and why**:

```typescript
const result = func.validate(input);
// Error example:
// {
//   path: "$input.order.product.price",
//   expected: "number & Minimum<0>",
//   value: -100
// }
```

"The price inside product inside order must be a number ≥ 0, but you gave -100." That's the level of precision.

`LlmJson.stringify()` then inserts these errors as `// ❌` inline annotations directly onto the LLM's original JSON output:

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

The LLM can see exactly where and why it went wrong, right on top of its own JSON. With this feedback, there's no need to rewrite everything — just correct the five flagged fields and retry.

### 2.5. The Full Loop: Parse → Coerce → Validate → Feedback → Retry

Combining everything introduced so far into a single loop, we get the complete picture of the validation feedback loop from Section 1:

```typescript
async function callWithFeedback(
  llm: LLM,
  func: ILlmFunction,
  prompt: string,
  maxRetries: number = 10,
): Promise<unknown> {
  let feedback: string | null = null;

  for (let i = 0; i < maxRetries; i++) {
    // 1. Request function call from LLM (with previous feedback)
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
      // 4. Generate structured feedback (// ❌ inline annotations)
      feedback = LlmJson.stringify(validated);
      continue;
    }

    // 5. Success
    return validated.data;
  }
  throw new Error("Max retries exceeded");
}
```

`parse()` rescues broken JSON and performs first-pass type correction. `validate()` catches schema violations. `LlmJson.stringify()` renders errors in a format the LLM can read. The LLM reads this feedback and corrects itself. **This is the complete engine that turns 6.75% into 100%.**

### 2.6. One Type Does It All

To sum up: define a single TypeScript type, and Typia handles the rest:

1. **Generates the schema** — `typia.llm.parameters<T>()`, `typia.llm.application<T>()`
2. **Parses** — `ILlmFunction.parse()` (broken JSON recovery + type coercion)
3. **Coerces** — `ILlmFunction.coerce()` (type coercion for SDK-parsed objects)
4. **Validates** — `ILlmFunction.validate()` (schema violation detection)
5. **Generates feedback** — `LlmJson.stringify()` (LLM-readable `// ❌` inline diagnostics)

**The type is the schema, the validator, and the prompt.**

---

## 3. The Case for Function Calling

So far, we've seen **how** function calling works through AutoBe and Typia. Now let's talk about **why** function calling is an effective methodology for domains that demand precision and correctness.

### 3.1. Natural Language vs. Types

Natural language is, well, natural. It evolved organically over millennia of human society, and ambiguity is a feature, not a bug. Metaphor, nuance, politeness, humor — all of it runs on ambiguity. "Just make it look nice" works as an instruction between humans.

Programming languages are designed. Someone intentionally built them to eliminate room for interpretation. "Just make it look nice" doesn't compile. Ambiguity is a bug.

**When people communicate in natural language, they misunderstand each other and argue. When they communicate in types and schemas, there's no misunderstanding.**

Let's contrast an LLM prompt with a type schema.

Expressing constraints via prompt:
> "The age field must be a positive integer greater than 18. Don't use string types for numeric fields. All required fields must be present..."

Several problems are visible. Does "greater than 18" mean >18 or ≥18? There's no way to verify whether the LLM followed these rules without inspecting the output. And as the schema grows more complex, rules like these multiply endlessly.

Expressing constraints via types:
```typescript
interface IMember {
  /** Only adults aged 19 or older can register */
  age: number & Type<"uint32"> & ExclusiveMinimum<18>;
}
```

`ExclusiveMinimum<18>` means >18. It's an integer. It's required. Unambiguous and mechanically verifiable.

In domains that demand precise results, defining a schema and annotating each field is far clearer, easier, and more verifiable than writing a natural language prompt.

### 3.2. The Pink Elephant Problem

If you've ever built a prompt-based AI agent, you've written prohibition rules:

- "Do not create utility functions"
- "Do not use the `any` type"
- "Do not create circular dependencies"

When someone says "don't think of a pink elephant," a pink elephant is the first thing that comes to mind. When you tell an LLM "don't do X," X is placed at the center of its attention. To avoid a forbidden pattern, the model must first recall that pattern — which paradoxically increases the probability of generating it. This is inherent to the token prediction mechanism.

Even knowing this problem, you can't avoid prohibition rules in prompts. "Don't do X" is the only tool natural language has for expressing constraints. I've never seen a prompt-based AI agent that doesn't use prohibition rules.

**In schemas, this problem doesn't exist.**

You don't need to say "don't use the `any` type" — if `any` isn't in the schema, the LLM physically can't produce it. You don't need to say "don't create utility functions" — if there's no slot for utility functions in the schema, that's the end of it. If the field type is limited to `"boolean" | "int" | "double" | "string" | "uri" | "uuid" | "datetime"` — seven options — there's no path for the LLM to write `"varchar"`.

Not prohibition, but **absence**. Prompts try to forbid what you don't want; schemas only permit what you do. This is why function calling is particularly effective in domains that demand precise output.

### 3.3. Model Neutrality

Prompt engineering is inherently model-dependent. A prompt optimized for GPT behaves differently on Claude, and differently again on Qwen. When a new model comes out or you want to experiment with a different one, it's not uncommon to rewrite prompts from scratch.

Function calling schemas are model-neutral. JSON Schema is JSON Schema. It means the same thing regardless of which model reads it, and the validation feedback loop absorbs any performance differences between models. A strong model gets it right in 1–2 attempts; a weaker model takes 10–15; both converge to 100%.

AutoBe running Qwen, GLM, DeepSeek, and OpenAI models on **the same schemas, the same pipeline**, achieving 100% compilation across the board, is proof of this neutrality. We've never done model-specific prompt tuning.

This changes the nature of model selection. It goes from "can this model do this task?" — a capability question — to "which model is the most cost-effective?" — a **cost optimization problem**: `average retries × tokens per attempt × price per token`.

### 3.4. The Core: Verifiability and the Feedback Loop

One thread runs through everything we've discussed.

The most powerful advantage of function calling is that **it brings LLM output into the domain of software engineering**.

If you let an LLM generate freeform text, determining whether that output is correct becomes yet another AI problem. Parsing is fuzzy. Validation is fuzzy. Correction is fuzzy. Everything is uncertain.

With function calling, the output is structured data. From that moment on, you can use the tools of software engineering:

1. **Verification is deterministic** — JSON Schema validation yields a clear pass/fail
2. **Feedback is precise** — "field X should be type Y, but you gave Z" can be identified exactly
3. **Correction converges** — precise feedback enables the model to fix only the affected parts

These three form a deterministic chain. The model is still probabilistic and still makes mistakes, but **the loop outside the model is deterministic**, so the process converges to 100%.

> **Typed Schema + Deterministic Validator + Structured Error Feedback = Reliable LLM Output**

If prompt engineering is about tinkering with the inside of the model, function calling is about making the outside of the model rock-solid. In domains that demand precision, the effectiveness of the latter approach is proven by results: 6.75% → 100%.

**The LLM doesn't need to be accurate. It just needs to be correctable. And correctability is not a property of the model — it's a property of the validation infrastructure.**

### 3.5. Application Spectrum: How Far Can This Go?

So is this pattern — function calling + validation feedback — limited to coding? No. It forms a spectrum based on verifiability.

#### 3.5.1. Domains Where All Output Is Verifiable

AutoBe's Database, Interface, Test, and Realize phases fall here. The compiler serves as the validator, guaranteeing 100% correctness.

This isn't unique to software. Any field where "correct or incorrect" can be mechanically determined supports the same structure, with a natural hierarchy based on verification cost:

| Domain | Fast (ms) | Medium (sec) | Deep (min+) |
|--------|----------|-------------|------------|
| Software | Type check | Compilation | Test execution |
| Semiconductors | DRC | LVS | SPICE simulation |
| Accounting | Arithmetic check | Account code validity | Regulatory audit |
| Law | Structural check | Logical consistency | Jurisdiction rules |

The feedback loop naturally exploits this hierarchy: run the cheapest validator first, fix the errors, then move to the next level.

#### 3.5.2. Domains Where Abstraction and Rigor Coexist

In practice, the space between "fully verifiable" and "completely unverifiable" is much wider. The pattern here is: let part of the output be freeform, and verify the rest strictly.

AutoBe's Analyze phase (requirements analysis) is a case in point. The structure of the SRS is validated by types, but the quality of its content can't be fully verified. Still, imposing structure alone delivers significant value. This isn't hypothetical — AutoBe already does this.

This pattern is transferable to other fields. Here are several examples, expressed as types.

**Law** — The AI develops legal arguments freely, but conclusions are classified in structured form:

```typescript
interface ILegalAnalysis {
  reasoning: string;                 // Abstract: AI develops arguments freely
  applicableClauses: IClause[];      // Rigorous: clauses classified by type
  classification: ILegalCategory;    // Rigorous: legal classification
}

interface IClause {
  type: "obligation" | "condition" | "warranty" | "indemnity"
      | "termination" | "confidentiality" | "limitation";
  title: string;
  description: string;
  subclauses: IClause[];  // Recursive structure
}
```

`reasoning` is free text — no validation. But the existence of clauses and the validity of `type` classifications are deterministically verifiable. A reviewer doesn't need to read the entire argument — just check "does this clause actually belong in this category?"

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

Balance sheet equilibrium (assets = liabilities + equity), account code validity, subtotal arithmetic — all can be turned into validators. Even if the AI writes `description` freely, whether totals add up and codes are valid can be verified instantly.

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
  sub_blocks: IBlock[];  // Recursive hierarchy
}
```

DRC (Design Rule Check, fast), LVS (Layout vs. Schematic, medium), SPICE simulation (slow). Costs vary by tier, but all are deterministic validations. The feedback loop starts with the cheapest — DRC.

**Medicine** — Diagnosis can be structured as a decision tree:

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
    if_true: IDecisionNode;   // Recursive
    if_false: IDecisionNode;  // Recursive
  }
}
```

ICD code (International Classification of Diseases) validity, decision tree completeness (no dead ends), clinical guideline compliance. The medical soundness of the diagnosis logic requires expert judgment, but structural integrity is mechanically verifiable.

---

Full disclosure: I'm a developer, not a domain expert in any of these fields. I can't guarantee 100%. But the core logic is the same: **if a domain has rules that determine correct from incorrect, this pattern is applicable.** Just as AutoBe proved this with code and compilers, I believe it's transferable to any field where logic and verifiability exist.

#### 3.5.3. Where This Doesn't Apply

Conversely, this pattern doesn't fit domains where deterministic validators can't be built. Creative writing, emotional intelligence, strategic decision-making. There's no validator for "a good novel" or "a wise business decision." I'll acknowledge that honestly.

---

## 4. Why Qwen

### 4.1. Function Calling Performance: Best in Class for Small/Medium Models

Let me start with the most direct answer to "why Qwen?"

AutoBe's entire pipeline is function calling. Whether a model writes good prose or carries on a smooth conversation doesn't matter. The only criterion is how accurately it fills complex JSON Schemas.

Qwen is not the only open-weight model that does function calling well. GLM, Kimi, and others deliver strong function calling performance at large model scales. But at the **small and medium scale**, Qwen was the only one that could handle function calling of this complexity.

Even a compact 3B-active-parameter MoE model supports tool choice and processes complex schemas containing 10+ variant recursive unions. For AutoBe, this small/medium-scale performance was decisive — the reasons why continue in the following sections.

### 4.2. R&D Cost: Users vs. Developers

For customers **using** AutoBe, model cost isn't an issue. Even the most expensive model is cheaper than actually hiring a backend developer.

But for us **developing** AutoBe, it's different. Every time we design a new type or add a new validation rule, we need to run the entire pipeline end to end. Thousands of generate-compile-feedback cycles. Using commercial models every time would be financially ruinous.

Local models make this R&D cycle possible. We can experiment without limit, without worrying about cost. The journey from 6.75% to 100% required hundreds of experiment cycles, and that was only possible because the models were local.

### 4.3. Small Models Make the Best QA Engineers

Large models make fewer mistakes. That's an advantage — and simultaneously a disadvantage.

Even when our validation has blind spots we haven't thought of, large models rarely trigger those failures. They "guess correctly" through ambiguous parts of the schema and get it right. Our mistakes stay hidden.

Switch to a small 35B-class model, and the story changes. Counterexamples come pouring out:

| Model | Success rate | What it found |
|-------|------------|---------------|
| `qwen3-30b-a3b-thinking` | ~10% | Fundamental schema ambiguities, missing required fields |
| `qwen3-next-80b-a3b-instruct` | ~20% | Subtle type mismatches in complex nested relationships |

The 10% success rate was the most valuable result. Every failure pointed to a gap in our system, and each fix strengthened the pipeline not just for weak models, but for **all models**.

AI is probabilistic. Large models make mistakes **less often**, not **never**. Counterexamples that surface with small models will eventually occur with large models too — just rarely. In production, "rarely" is an outage.

**When the schema is precise enough that even a 35B model can't misinterpret it, the probability of a strong model getting it wrong converges to effectively zero.**

### 4.4. No Vendor Lock-In

Price changes, model deprecation, and rate limits for commercial APIs are entirely at the vendor's discretion. The model you use today could disappear tomorrow.

AutoBe's function calling schemas are designed to be model-neutral. We don't use model-specific prompt tricks. JSON Schema and type-based validation are industry standards — the code stays the same even when the model changes.

### 4.5. Open Source + Open Weights: A Virtuous Cycle

AutoBe is open source (AGPL 3.0), and Qwen is open-weight. Both are part of the open ecosystem.

This combination is what made thousands of experiments possible, what made edge case discovery possible, and what made system hardening possible. With commercial models, experimentation at this scale would have been financially impossible.

The open ecosystem creates a virtuous cycle of mutual reinforcement:
- AutoBe hardens its system using Qwen
- The hardened system proves Qwen's production-level viability
- Improvements to Qwen raise AutoBe's overall performance
- AutoBe's discoveries (like the double-stringify issue) can contribute to Qwen's improvement

---

## 5. Closing

AutoBe achieved 100% compilation success across all four Qwen models through an all-in function calling strategy.

What made it possible was neither smarter prompts nor more sophisticated orchestration. It was the type-based infrastructure Typia provides — automatic schema generation, lenient parsing, type coercion, validation feedback — deterministically overcoming the model's probabilistic limitations.

When you communicate in types, there's no misunderstanding. When you constrain with schemas, there's no pink elephant. When you have a deterministic validation loop, even 6.75% becomes 100%.

This pattern isn't limited to coding. It's transferable to any field where logic and structural integrity exist.

And what made all of this experimentation and validation possible was Qwen — an open-weight model.

The LLM doesn't need to be accurate. It just needs to be correctable.

---

**About AutoBe**: [AutoBe](https://github.com/wrtnlabs/autobe) is an open-source AI agent developed by [Wrtn Technologies](https://wrtn.io). It generates production-ready backend applications from natural language.

**About Typia**: [Typia](https://github.com/samchon/typia) is a compiler library that automatically generates runtime validators, JSON Schema, and function calling schemas from TypeScript types.

---

## Appendix: Deep Dive on Union Types

Union types appear throughout this talk, from start to finish. The 10 variants of `IJsonSchema` (Section 1.3), the 30+ variants of `IExpression` (Section 1.3), Qwen 3.5's double-stringify issue (Section 1.5), type coercion (Section 2.3), validation feedback (Section 2.4). How well you handle union types determines the quality of your function calling infrastructure.

### A.1. What Is a Discriminated Union?

A union type represents "one of several kinds." For example, if a payment method can be either a card or a bank transfer:

```typescript
type Payment =
  | { type: "card"; cardNumber: string; cvc: string }
  | { type: "bank_transfer"; bankCode: string; accountNumber: string }
```

A **discriminated** union is a union that has a **discriminator field** — a single field whose value determines which variant the data belongs to. In the example above, `type` is the discriminator. If `type` is `"card"`, the data has `cardNumber` and `cvc`; if it's `"bank_transfer"`, it has `bankCode` and `accountNumber`. **A single discriminator value determines the rest of the structure.**

Why does this matter? When an LLM generates data for a union type and makes a mistake, correcting it requires knowing "which variant was this data intended to be?" first. Without a discriminator, intent can't be determined. Without determining intent, precise feedback is impossible.

AutoBe's `IJsonSchema` (10 variants) and `IExpression` (30+ variants) are all discriminated unions, and Typia's ability to leverage these discriminators for precise type coercion and validation feedback is the core mechanism behind 6.75% → 100%.

### A.2. Typia's `x-discriminator` — Adding Intelligence to `anyOf`

The JSON Schema standard offers two ways to represent union types: `anyOf` (matches any) and `oneOf` (matches exactly one). But neither carries **"which field distinguishes the variants"** — they just say "match one of these schemas."

OpenAPI 3.x has a `discriminator`, but it's exclusive to `oneOf`, and most LLMs don't handle `oneOf` reliably.

Typia solves this with a plugin property called `x-discriminator`. It uses `anyOf` — which LLMs broadly support — while attaching discriminator metadata:

```json
// Schema generated by Typia (simplified)
{
  "anyOf": [
    { "type": "object", "properties": { "type": { "const": "card" }, "cardNumber": { ... } } },
    { "type": "object", "properties": { "type": { "const": "bank_transfer" }, "bankCode": { ... } } }
  ],
  "x-discriminator": {
    "propertyName": "type",
    "mapping": {
      "card": "#/$defs/CardPayment",
      "bank_transfer": "#/$defs/BankTransferPayment"
    }
  }
}
```

This enables three things:

1. **When the LLM reads the schema**: It sees `x-discriminator`'s `propertyName` and gets the hint "use the `type` field to select a variant"
2. **When Typia coerces types**: `coerce()` identifies the variant via the discriminator value, then applies coercion rules specific to that variant's schema. This is also how Qwen 3.5's double-stringify issue is resolved
3. **When Typia generates errors**: `validate()` identifies the variant via the discriminator, then produces precise per-field errors for that specific variant. Not "doesn't match any of 10 variants," but "card variant's cardNumber should be string, but you gave number"

**With `anyOf` alone, neither precise coercion nor precise feedback is possible for union types. `x-discriminator` is what makes it possible.** This is why the type coercion from Section 2.3 and validation feedback from Section 2.4 work on union types as well.

### A.3. The World Is Made of Recursive Unions

Let's revisit the domain types from Section 3:

- Law: `IClause` → `subclauses: IClause[]` (recursive)
- Semiconductors: `IBlock` → `sub_blocks: IBlock[]` (recursive)
- Medicine: `IDecisionNode` → `if_true: IDecisionNode` (recursive)
- Accounting: Chart of accounts is a tree of major → intermediate → minor categories (recursive)

These are all structurally identical to AutoBe's `IJsonSchema` (10 variants) and `IExpression` (30+ variants). They're ASTs — abstract syntax trees. Data in structured domains is ultimately a tree, and the moment a tree's nodes come in multiple kinds, it becomes a **recursive union type**.

In Section 3, we said "if a domain's output is verifiable, the function calling + validation feedback pattern is transferable." But if the data structures of those domains are all recursive unions, then **conquering union types is the prerequisite for that transfer**.

If coercion doesn't work on union types, Qwen 3.5's double-stringify problem will surface in chip design too. If validation feedback doesn't work on union types, "doesn't match any of 30 variants" won't get the feedback loop to converge. If you can't identify the variant via a discriminator, correction itself is impossible.

Typia's `x-discriminator`, schema-based coercion, and discriminator-aware validation are the solution for this universal structure. AutoBe's 6.75% → 100% is not just an achievement in code generation. **It's the establishment of 100% reliability on the universal structure of recursive unions — an achievement transferable to every structured domain that shares this structure.**

### A.4. Why Not Zod?

Zod is the most popular runtime validation library in the TypeScript ecosystem. "Why don't you use Zod?" is a question we get often.

Let's see what happens when you try to define AutoBe-scale 30+ variant recursive discriminated unions in Zod:

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

Three problems.

**First, you must define TypeScript types and Zod schemas separately.**

Zod's official documentation states this explicitly: "you can define a recursive schema in Zod, but because of a limitation of TypeScript, their type can't be statically inferred." When you use `z.lazy()`, `z.infer` doesn't work, so you must define a TypeScript interface separately and pass it manually via `z.ZodType<T>`:

```typescript
// 1. Define the TypeScript type first
type IExpression =
  | { type: "booleanLiteral"; value: boolean }
  | { type: "callExpression"; expression: IExpression; arguments: IExpression[] }
  | { type: "binaryExpression"; left: IExpression; operator: string; right: IExpression }
  // ... 27 more

// 2. Define the Zod schema separately, manually linking the type hint
const ExpressionSchema: z.ZodType<IExpression> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("booleanLiteral"), value: z.boolean() }),
    z.object({ type: z.literal("callExpression"), expression: ExpressionSchema, arguments: z.array(ExpressionSchema) }),
    z.object({ type: z.literal("binaryExpression"), left: ExpressionSchema, operator: z.string(), right: ExpressionSchema }),
    // ... 27 more
  ])
);
```

For a 30+ variant recursive union, this dual definition runs to hundreds of lines. Over time the two drift apart, and there's nothing to catch the mismatch.

**Second, even with dual definitions, it won't compile.**

As the depth of recursive unions increases, you hit TypeScript's generic instantiation limit:

> TS2589: Type instantiation is excessively deep and possibly infinite.

This is the most recurrently reported error in Zod's issue tracker. [#577](https://github.com/colinhacks/zod/issues/577), [#5064](https://github.com/colinhacks/zod/issues/5064), [#5256](https://github.com/colinhacks/zod/issues/5256) — this error appears with recursive schemas, and it remains unresolved in Zod v4. [Discussion #1459](https://github.com/colinhacks/zod/discussions/1459) even shows the same error with complex discriminated unions that aren't recursive at all. At the scale of `IExpression`'s 30+ variant recursive union, IDE autocompletion freezes and the type checker gives up.

**Third, even after enduring all of that, validation feedback is fundamentally impossible.**

This is the most critical problem.

When validation fails on a union type, Zod can't determine "which variant was this value intended to be." In a 10-variant union, errors either flood out for all variants at once ([#792](https://github.com/colinhacks/zod/issues/792)), or — if the discriminator doesn't match — errors for other fields are silently hidden ([#2202](https://github.com/colinhacks/zod/issues/2202)). In Zod v4, this actually regressed: on discriminator mismatch, it returns an empty error array and "No matching discriminator" ([#4909](https://github.com/colinhacks/zod/issues/4909), [#5670](https://github.com/colinhacks/zod/issues/5670)).

Think about it from the LLM's perspective. If it intended a `callExpression` variant but got the `arguments` field's type wrong, it needs feedback like "arguments should be an IExpression array, but you gave a string." But Zod says "doesn't match any of 10 variants." Feedback that doesn't tell you what to fix isn't feedback at all.

Typia first identifies the variant using the discriminator field (`type`), then generates precise per-field errors against that variant's schema. This is the prerequisite for the validation feedback loop to converge, and Zod lacks this mechanism entirely.

**In summary: with Zod, you get dual definitions, compilation failure, and — even then — no feedback loop.** The very engine behind AutoBe's 6.75% → 100% simply cannot exist on top of Zod.

With Typia, a single TypeScript interface is all you need:

```typescript
const result = typia.validate<AutoBeTest.IExpression>(llmOutput);
```

It operates at the compiler level, so it handles types of any complexity. No separate schema definitions, no generic depth limits, no incomplete error messages.
