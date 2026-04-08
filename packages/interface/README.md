# `@autobe/interface`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/interface.svg)](https://www.npmjs.com/package/@autobe/interface)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/interface.svg)](https://www.npmjs.com/package/@autobe/interface)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

Type definitions for the [AutoBE](https://github.com/wrtnlabs/autobe) system.

Every other AutoBE package depends on this. Events, histories, AST nodes, RPC contracts, compiler diagnostics — all shared types live here.

## Usage

```typescript
import {
  AutoBeEvent,
  AutoBeHistory,
  AutoBePhase,
  IAutoBeAgent,
  IAutoBeRpcService,
  IAutoBeRpcListener,
} from "@autobe/interface";

// Every package in AutoBE communicates through these types.
// See @autobe/agent README for a runnable example.
```
