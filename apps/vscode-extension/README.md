# `autobe-vscode-extension`

[![GitHub License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/wrtnlabs/autobe/blob/master/LICENSE)
[![Build Status](https://github.com/wrtnlabs/autobe/workflows/build/badge.svg?branch=main)](https://github.com/wrtnlabs/autobe/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://autobe.dev/docs/)
[![Discord Badge](https://dcbadge.limes.pink/api/server/https://discord.gg/aMhRmzkqCx?style=flat)](https://discord.gg/aMhRmzkqCx)

VS Code extension for [AutoBE](https://github.com/wrtnlabs/autobe).

Runs the AutoBE agent directly inside VS Code via a sidebar webview panel. Compatible with both VS Code and Cursor.

## Scripts

```bash
pnpm run build              # Full build (webview + worker + extension)
pnpm run webview:build      # Build webview UI
pnpm run webview:dev        # Webview dev server
pnpm run worker:build       # Build worker thread
pnpm run test               # Run extension tests
```
