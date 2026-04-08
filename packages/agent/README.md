# `@autobe/agent`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/agent.svg)](https://www.npmjs.com/package/@autobe/agent)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/agent.svg)](https://www.npmjs.com/package/@autobe/agent)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

AI agent orchestration engine for [AutoBE](https://github.com/wrtnlabs/autobe).

40+ specialized AI agents collaborate through the 5-phase waterfall pipeline (Analyze → Database → Interface → Test → Realize) to generate a complete NestJS + Prisma backend from natural language.

## Usage

```typescript
import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import OpenAI from "openai";

const agent = new AutoBeAgent({
  vendor: {
    api: new OpenAI({
      apiKey: "sk-or-...",
      baseURL: "https://openrouter.ai/api/v1",
    }),
    model: "qwen/qwen3.5-35b-a3b",
    semaphore: 16,
  },
  config: {
    locale: "en-US",
    timezone: "Asia/Seoul",
  },
  compiler: (listener) => new AutoBeCompiler(listener),
  tokenUsage: new AutoBeTokenUsage(),
});

// Listen to events
agent.on("databaseSchemaStart", (e) => console.log("Generating schema..."));
agent.on("realizeWriteStart", (e) => console.log("Writing code..."));

// Conversate
await agent.conversate("Create a discussion board with comments");

// Retrieve results
const files = await agent.getFiles();
const phase = agent.getPhase();
const usage = agent.getTokenUsage();
const histories = agent.getHistories();
```
