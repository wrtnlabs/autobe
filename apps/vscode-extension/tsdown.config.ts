import { default as unplugin } from "@ryoppippi/unplugin-typia";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/extension.ts",
  outDir: "./dist",
  target: "es2022",
  platform: "node",
  clean: true,
  shims: true,
  sourcemap: true,
  external: ["vscode"],
  plugins: [unplugin.rollup()],
});
