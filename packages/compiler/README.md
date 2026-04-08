# `@autobe/compiler`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/compiler.svg)](https://www.npmjs.com/package/@autobe/compiler)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/compiler.svg)](https://www.npmjs.com/package/@autobe/compiler)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Three-tier validation and code generation engine for [AutoBE](https://github.com/wrtnlabs/autobe).

Validates AI-generated output through Prisma → OpenAPI → TypeScript compilation tiers. When validation fails, structured diagnostics feed back to agents for automatic correction — this is how AutoBE achieves 100% compilation guarantee.

## Usage

```typescript
import { AutoBeCompiler } from "@autobe/compiler";

const compiler = new AutoBeCompiler({
  realize: {
    test: {
      onOperation: async () => {},
      onReset: async () => {},
    },
  },
});

// Sub-compilers: compiler.database, compiler.interface,
//   compiler.typescript, compiler.test, compiler.realize

// Get project template files
const template = await compiler.getTemplate({
  phase: "interface",
  dbms: "postgres",
});
```
