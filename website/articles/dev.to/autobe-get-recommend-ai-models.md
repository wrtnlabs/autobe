# Seeking Local LLM Recommendations for AST Generation (by Function Calling)

> Looking for Local LLM recommendations that can generate complex AST structures through function calling. This is an area that shows different performance patterns from existing programming benchmarks, so looking for models that can be actually tested.

## Our Approach

We're developing AutoBE, an open-source project that automatically generates backend applications.

AutoBE's core principle differs from typical AI code generation. Instead of having AI write backend source code as text, we have AI generate AST (Abstract Syntax Tree) - the compiler's structured representation - through function calling. When invalid AST data is generated, we validate it logically and provide feedback to the AI, or compile it to generate backend applications.

The AST structures we use are quite complex. Below are examples of AutoBE's AST structure - as you can see, countless elements are intertwined through union types and tree structures.

- [`AutoBePrisma.IApplication`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/prisma/AutoBePrisma.ts) ([function calling schema](https://typia.io/playground/?script=JYWwDg9gTgLgBAbzgQQK4wgIQKYAUrADOIAhnAL5wBmUEIcARAAInoQBG2A9MAHYzYoVEgGNsDANwAoUJFiI4ASQAyAGxDIwYVcBEkYwCLwrVa9ZoRIgRACyNcIYbLxJhgkmeGjwYATzdkNHSMfgEeUiJGhPCuYABcSmoaWjp6BkYAPAy2+gDmYDAMAHxwALxwocAkAHSq6tWxqfqGvBlScIjtHXAA7gQCALIQACbYqgAU8QogI2MJaBg4+ESk1YpDo6oUAJQJAG4QwMPSHeQANF3ZNnkFDFJF49vSkbyEEKrYtRC547FPUkA))
- [`AutoBeOpenApi.IDocument`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts) ([function calling schema](https://typia.io/playground/?script=JYWwDg9gTgLgBAbzgQQK4wgIQKYHkzYB2yYwcAvnAGZQQhwBEAAgIboQBG2A9MITNihUWAY2wMA3AChQkWIjgBJADIAbECTCrgIljGAQucUhSq06BBiEEALfewhhsXBmGBjJ4aPBgBPFw3KU1DQ+fm7igvpEcM5gAFzyyqrqmtq6+gA8NNY6AOZgMDQAfHAAvHAhwAwAdEoqVTEpOnpc6eJwiG3tcADuUMC8APIOUE36ABRxsmSoXIJpXPFoGDj4RFVyAGIzc82GAJTxAG4QwAAmEu3EADSdWVa5+TTihWN7EhFcBBBK2DUQOWMYm9xEA))
- [`AutoBeTest.IFunction`](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts) ([function calling schema](https://typia.io/playground/?script=JYWwDg9gTgLgBAbzgQQK4wgIQKYBVsDO8AvnAGZQQhwBEAAgIboQBG2A9MAHYzZRkMAxthoBuAFChIsRHACSAGQA2IZGDBLgghjGAQucUhSq06BBiEEALfewhhsXBmGBjJ4aPBgBPFw3KU1DQ+fm7igvpEcM5gAFzyyqrqmtq6+gA8NNY6AOZgMDQAfHAAvHAhwAwAdEoqVTEpOnpc6eJwiG3tcADuUMC8APIOUE36ABRxsmSoXIJpXPFoGDj4RFVyAGIzc82GAJTxAG4QwAAmEu3EADSdWVa5+TTihWN7EhFcBBBK2DUQOWMYm9xEA))

```typescript
export namespace AutoBeOpenApi {
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
  export namespace IJsonSchema {
    export interface IObject {
      type: 'object';
      properties: Record<string, IJsonSchema>;
      required: string[];
      additionalProperties?: boolean | IJsonSchema;
      description?: string;
    }
  }
}

export namespace AutoBeTest {
  export type IExpression =
    // LITERALS
    | IBooleanLiteral
    | INumericLiteral
    | IStringLiteral
    | IArrayLiteralExpression
    | IObjectLiteralExpression
    | INullLiteral
    | IUndefinedKeyword
    // ACCESSORS
    | IIdentifier
    | IPropertyAccessExpression
    | IElementAccessExpression
    // OPERATORS
    | ITypeOfExpression
    | IPrefixUnaryExpression
    | IPostfixUnaryExpression
    | IBinaryExpression
    // FUNCTIONAL
    | IArrowFunction
    | ICallExpression
    | INewExpression
    | IArrayFilterExpression
    | IArrayForEachExpression
    | IArrayMapExpression
    | IArrayRepeatExpression
    // RANDOM GENERATORS
    | IPickRandom
    | ISampleRandom
    | IBooleanRandom
    | IIntegerRandom
    | INumberRandom
    | IStringRandom
    | IPatternRandom
    | IFormatRandom
    | IKeywordRandom
    // PREDICATORS
    | IEqualPredicate
    | INotEqualPredicate
    | IConditionalPredicate
    | IErrorPredicate;
  export interface IElementAccessExpression {
    type: "elementAccessExpression";
    expression: IExpression;
    questionDot?: boolean;
    argumentExpression: IExpression;
  }
}
```

## Why This Matters for AI Model Performance

Because AutoBE is heavily dependent on AI models' function calling capabilities, typical AI model programming abilities and benchmark rankings often show completely different results in AutoBE.

In practice, `openai/gpt-4.1` and `openai/gpt-4.1-mini` models actually create backend applications better than `openai/gpt-5` in AutoBE. The `qwen3-next-80b-a3b` model handles DTO types (`AutoBeOpenApi.IJsonSchema`) very well, while `qwen3-coder` (450b), which has far more parameters, fails completely at DTO type generation (0% success rate). This shows patterns completely different from typical AI benchmarks.

## Our Benchmarking Initiative

Based on this, our AutoBE team conducts ongoing benchmark tests on AI models using the AutoBE project and plans to publish these regularly as reports.

However, AutoBE has been developed and optimized targeting `openai/gpt-4.1` and `openai/gpt-4.1-mini`, and we've only recently begun introducing and testing Local LLMs like `qwen3-235b-a22b` and `qwen3-next-80b-a3b`.

Therefore, aside from qwen3, we don't know well which other models can effectively create complex structures like AST through function calling or structured output. We want to receive recommendations for various Local LLM models from this community, experiment and validate them with AutoBE, and publish them as benchmark reports.

Thank you for reading this long post, and we appreciate your model recommendations.

---------------

<sub>Model</sub> \ <sup>Backend</sup> | `todo` | `bbs` | `reddit` | `shopping`
--------------------------------------|--------|-------|----------|------------
`openai/gpt-4.1-mini`                 | ✅    | ✅    | ✅       | ✅
`openai/gpt-4.1`                      | ✅    | ✅    | ✅       | ✅
`openai/gpt-5`                        | ✅    | ✅    | ❌       | ❌
`qwen3-next-80b-a3b`                  | ✅    | ✅    | ✅       | ❌
`qwen3-235b-a22b`                     | ✅    | ✅    | ❌       | ❌
`qwen3-coder` (450b-a30b)             | ❌    | ❌    | ❌       | ❌