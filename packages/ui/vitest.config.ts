import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: [],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "lib", "dist"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/**/*.test.ts", "src/**/*.spec.ts"],
    },
  },
});
