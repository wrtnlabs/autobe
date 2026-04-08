# `@autobe/ui`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@autobe/ui.svg)](https://www.npmjs.com/package/@autobe/ui)
[![NPM Downloads](https://img.shields.io/npm/dm/@autobe/ui.svg)](https://www.npmjs.com/package/@autobe/ui)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

React component library for the [AutoBE](https://github.com/wrtnlabs/autobe) frontend.

Chat interface, real-time event visualization, and session management. Shared by the playground, hackathon, and dashboard apps.

## Usage

```tsx
import {
  AutoBeAgentProvider,
  AutoBeListener,
  IAutoBeServiceData,
} from "@autobe/ui";

const serviceFactory = async (config) => {
  const listener = new AutoBeListener();
  const session = await api.sessions.create(connection, {
    vendor_id: config.vendorId,
    model: config.model,
    locale: config.locale,
  });
  const { driver: service, connector } =
    await api.sessions.connect(connection, session.id, listener.getListener());

  return {
    service,
    sessionId: session.id,
    listener,
    close: () => connector.close(),
  } satisfies IAutoBeServiceData;
};

<AutoBeAgentProvider serviceFactory={serviceFactory}>
  <YourApp />
</AutoBeAgentProvider>
```
