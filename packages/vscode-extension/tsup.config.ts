import unpluginTypia from "@ryoppippi/unplugin-typia/esbuild";
import { defineConfig } from "tsup";

import packageJson from "./package.json" with { type: "json" };

const banner = `/**
* ${packageJson.name} v${packageJson.version}
* (c) ${packageJson.author}s
* Released under the ${packageJson.license} License
*/`;

export default defineConfig({
  esbuildPlugins: [unpluginTypia()],
  entry: ["./src/extension.ts"],
  splitting: false,
  sourcemap: true,
  dts: true,
  format: "esm",
  banner: {
    js: banner,
  },
  clean: true,
  platform: "node",
  external: [
    /** Runtime injection */
    "vscode",
    /** Unused peer dependency of 3rd party package */
    "@modelcontextprotocol/sdk",
    "prettier-plugin-svelte",
    "@vue/compiler-sfc",
    "svelte/compiler",
  ],
});
