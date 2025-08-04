import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "../webview-ui/build",
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
      },
    },
  },
});
