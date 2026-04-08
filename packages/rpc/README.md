# `@autobe/rpc`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/rpc.svg)](https://www.npmjs.com/package/@autobe/rpc)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/rpc.svg)](https://www.npmjs.com/package/@autobe/rpc)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

WebSocket RPC bridge for [AutoBE](https://github.com/wrtnlabs/autobe).

Wraps `AutoBeAgent` and exposes it to remote clients over WebSocket with full type safety via [TGrid](https://github.com/samchon/tgrid). Events stream back in real time.

## Usage

```typescript
import { AutoBeRpcService } from "@autobe/rpc";
import { WebSocketAcceptor } from "tgrid";

const service = new AutoBeRpcService({
  agent,
  listener: acceptor.getDriver(),
  onStart: () => console.log("Generation started"),
  onComplete: (histories) => {
    // Save conversation histories to DB
  },
});

await acceptor.accept(service);
```
