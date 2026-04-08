# `@autobe/filesystem`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/filesystem.svg)](https://www.npmjs.com/package/@autobe/filesystem)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/filesystem.svg)](https://www.npmjs.com/package/@autobe/filesystem)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

File system abstraction for [AutoBE](https://github.com/wrtnlabs/autobe).

Recursive file traversal, gzip compression, and Git repository management with lazy caching.

## Usage

```typescript
import { FileSystemIterator, CompressUtil } from "@autobe/filesystem";

// Read all TypeScript files recursively
const files = await FileSystemIterator.read({
  root: "/path/to/repo/src",
  extension: "ts",
  prefix: "src/",
});
// → { "src/main.ts": "...", "src/utils/helper.ts": "..." }

// Write files to disk
await FileSystemIterator.save({
  root: "/output/path",
  files: { "main.ts": "export const x = 1;" },
});

// Gzip compress/decompress
const compressed = await CompressUtil.gzip(jsonString);
const restored = await CompressUtil.gunzip(compressed);
```
