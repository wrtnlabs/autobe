<!--
[AutoBE] Hardcore Function Calling Benchmark in backend coding agent.
-->

## Hardcore Benchmark

[AutoBE](https://github.com/wrtnlabs/autobe) is an open-source project that generates backend applications through extensive function calling.

As AutoBE utilizes LLM function calling in every phase instead of plain text writing, including compiler's AST (Abstract Syntax Tree) structures of infinite depths, I think this can be the most extreme function calling benchmark ever.

- [DB Compiler's AST](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/prisma/AutoBePrisma.ts)
- [API specification's AST](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/openapi/AutoBeOpenApi.ts)
- [Test function's AST](https://github.com/wrtnlabs/autobe/blob/main/packages/interface/src/test/AutoBeTest.ts)

```typescript
// Example of AutoBE's AST structure
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
}
```

## Limitations

Of course, as you can see, the number of DB schemas and API operations generated for the same topic varies greatly by each model. When [`anthropic/claude-sonnet-4.5`](https://github.com/wrtnlabs/autobe-examples/tree/main/anthropic/claude-sonnet-4.5/shopping) and [`openai/gpt-5.1`](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-5.1/shopping) create 630 and 2,000 test functions respectively for the same topic, [`qwen/qwen3-next-80b-a3b`](https://github.com/wrtnlabs/autobe-examples/tree/main/qwen/qwen3-next-80b-a3b-instruct/shopping) creates 360.

Moreover, function calling in AutoBE includes a [validation feedback](https://autobe.dev/docs/concepts/function-calling/#validation-feedback) process that detects detailed type errors and provides feedback to the AI for recovery, even when the AI makes mistakes and creates arguments of the wrong type.

Simply scoring and ranking based solely on compilation/build success, and evaluating each model's function calling capabilities in depth based only on the success rate of function calling with validation feedback, is still far from sufficient.

Therefore, please understand that the current benchmark is simply uncontrolled and only indicates whether or not each AI model can properly construct extremely complex types, including compiler AST structures, through function calling.

> AutoBE is also still incomplete.
> 
> Even if the backend application generated through this guarantees a 100% compilation success rate, it does not guarantee a 100% runtime success rate. This is an open-source project with a long way to go in development and mountains of research still to be done.
>
> However, we hope that this can serve as a reference for anyone planning function calling with extremely complex types like ours, and contribute even a little to the AI ecosystem.

## Promise

https://www.reddit.com/r/LocalLLaMA/comments/1o3604u/autobe_achieved_100_compilation_success_of/

A month ago, we achieved a 100% build success rate for small to medium-sized backend applications with `qwen3-next-80b-a3b`, and promised to complete RAG optimization in the future to enable the generation of large-scale backend applications on Local LLMs.

Now this has become possible with various Local LLMs such as Qwen3/DeepSeek/Kimi, in addition to commercial models like GPT and Sonnet. While prompting and RAG optimization may not yet be perfect, as models like GPT-5.1 run wild creating as many as 2,000 test functions, we will resolve this issue the next time we come back.

And since many people were curious about the performance of various Local LLMs besides `qwen3-next-80b-a3b`, we promised to consistently release benchmark data for them. While it's unfortunate that the benchmark we released today is inadequate due to lack of controlled variables and can only determine whether function calling with extremely complex types is possible or not, we will improve this as well next time.

We, the two AutoBE developers, will continue to dedicate ourselves to its development, striving to create an environment where you can freely generate backend applications on your local devices without cost burden.

In addition, we are always grateful to the specialists who build and freely distribute open-source AI models.

## Links

- AutoBE: https://github.com/wrtnlabs/autobe
- Benchmark Result: https://github.com/wrtnlabs/autobe-examples
