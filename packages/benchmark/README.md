# `@autobe/benchmark`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/benchmark.svg)](https://www.npmjs.com/package/@autobe/benchmark)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/benchmark.svg)](https://www.npmjs.com/package/@autobe/benchmark)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Benchmarking and replay testing framework for [AutoBE](https://github.com/wrtnlabs/autobe).

Runs different LLM vendors through 6 example projects (todo, bbs, reddit, shopping, account, erp) across all 5 pipeline phases, archives every conversation history and event snapshot, then scores and ranks the results.

## Usage

```typescript
import { AutoBeExampleBenchmark, AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";

await AutoBeExampleBenchmark.execute(
  {
    createAgent: async (props) =>
      new AutoBeAgent({
        vendor: { api, model: "gpt-4.1" },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories: props.histories,
      }),
  },
  {
    vendors: ["openai", "anthropic"],
    projects: ["todo", "reddit"],
    progress: (state) => console.log(state),
  },
);

// Load archived results
const histories = await AutoBeExampleStorage.getHistories({
  vendor: "openai",
  project: "todo",
  phase: "interface",
});
```
