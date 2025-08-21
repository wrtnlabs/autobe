import { default as unplugin } from "@ryoppippi/unplugin-typia";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  target: "es2022",
  platform: "node",
  clean: true,
  shims: true,
  sourcemap: true,
  external: ["./biome_wasm_bg.wasm"],
  noExternal: [
    "@samchon/openapi",
    "@samchon/openapi/lib/converters/OpenApiV3_1Emender",
    "@samchon/openapi/lib/composers/LlmSchemaComposer",
    "@samchon/openapi/lib/converters/OpenApiV3Downgrader",
    "@samchon/openapi/lib/utils/OpenApiExclusiveEmender",
    "@autobe/compiler",
    "@autobe/agent",
    "@autobe/rpc",
    "@agentica/core",
    "openai",
    "tgrid",
  ],
  plugins: [unplugin.rollup()],
});
