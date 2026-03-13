import { default as unplugin } from "@typia/unplugin";
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
