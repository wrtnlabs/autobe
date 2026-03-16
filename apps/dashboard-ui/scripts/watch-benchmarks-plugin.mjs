import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { aggregate } from "./aggregate-benchmarks.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.resolve(
  __dirname,
  "../../../packages/estimate/reports/benchmark",
);

/**
 * Vite plugin that watches the benchmark reports directory and
 * auto-regenerates benchmark-summary.json when files change.
 * Triggers a full page reload via Vite's HMR.
 */
export default function watchBenchmarksPlugin() {
  let watcher = null;
  let debounceTimer = null;
  let server = null;

  function regenerate() {
    try {
      console.log("[watch-benchmarks] Reports changed, regenerating...");
      aggregate();
      console.log("[watch-benchmarks] benchmark-summary.json updated");
      if (server) {
        server.ws.send({ type: "full-reload" });
      }
    } catch (err) {
      console.error("[watch-benchmarks] Regeneration failed:", err.message);
    }
  }

  function debouncedRegenerate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(regenerate, 1000);
  }

  return {
    name: "watch-benchmarks",
    configureServer(viteServer) {
      server = viteServer;

      // Initial generation
      try {
        aggregate();
        console.log("[watch-benchmarks] Initial benchmark-summary.json generated");
      } catch (err) {
        console.error("[watch-benchmarks] Initial generation failed:", err.message);
      }

      // Watch reports directory recursively
      if (fs.existsSync(REPORTS_DIR)) {
        watcher = fs.watch(REPORTS_DIR, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith(".json")) {
            debouncedRegenerate();
          }
        });
        console.log(`[watch-benchmarks] Watching ${REPORTS_DIR}`);
      } else {
        console.warn(`[watch-benchmarks] Reports dir not found: ${REPORTS_DIR}`);
      }
    },
    closeBundle() {
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    },
  };
}
