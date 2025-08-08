import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import wasm from "@rollup/plugin-wasm";
import { builtinModules } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "src/extension.ts",
  output: {
    dir: "dist",
    format: "cjs", // ← CJS
    sourcemap: true,
    chunkFileNames: "chunks/[name]-[hash].js",
  },
  external: ["vscode", ...builtinModules, "read-pkg", "unicorn-magic"],
  plugins: [
    alias({
      entries: [
        {
          // @autobe/something → ../something/src
          find: /^@autobe\/([^/]+)$/,
          replacement: (id) => {
            // $1에 해당하는 캡처 그룹 추출
            const pkgName = id.match(/^@autobe\/([^/]+)$/)?.[1];
            return path.resolve(__dirname, `../${pkgName}/lib/index.js`);
          },
        },
      ],
    }),
    json({
      preferConst: true,
      compact: true,
      namedExports: true,
    }),
    resolve({ preferBuiltins: true }),
    commonjs({
      requireReturnsDefault: "preferred", // default interop 유연하게
      ignore: ["prettier", "@trivago/prettier-plugin-sort-imports"],
      ignoreDynamicRequires: true,
    }),
    wasm({
      maxFileSize: 1_000_000_000, // 1GB
      fileName: "chunks/[name][extname]",
    }),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
};
