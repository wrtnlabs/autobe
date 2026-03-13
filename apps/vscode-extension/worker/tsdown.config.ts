import { default as unplugin } from "@typia/unplugin";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  target: "es2022",
  platform: "node",
  clean: true,
  shims: true,
  format: "esm",
  sourcemap: true,
  noExternal: [
    "@typia/utils",
    "@autobe/compiler",
    "@autobe/agent",
    "@autobe/rpc",
    "@agentica/core",
    "openai",
    "tgrid",
  ],
  plugins: [unplugin.rollup()],
});
