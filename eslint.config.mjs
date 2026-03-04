import tseslint from "typescript-eslint";

import rule from "./.eslint/noInlineObjectLiteralType.js";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "apps/**",
      "website/**",
      "test/**",
      "internals/**",
      ".next/**",
      "coverage/**",
      "**/*.d.ts",
      "**/*.js",
      "packages/agent/src/constants/**",
    ],
  },
  {
    files: [
      "packages/interface/src/**/*.ts",
      "packages/agent/src/orchestrate/*/structures/**/*.ts",
    ],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      local: { rules: { "no-inline-object-type": rule } },
    },
    rules: {
      "local/no-inline-object-type": "error",
    },
  },
];
