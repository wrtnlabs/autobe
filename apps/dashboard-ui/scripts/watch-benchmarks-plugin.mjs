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

const POLL_INTERVAL = 3000; // 3 seconds

/**
 * Vite plugin that polls the benchmark reports directory and
 * auto-regenerates benchmark-summary.json when files change.
 * Triggers a full page reload via Vite's HMR.
 */
export default function watchBenchmarksPlugin() {
  let pollTimer = null;
  let server = null;
  let lastSnapshot = "";

  function getSnapshot() {
    if (!fs.existsSync(REPORTS_DIR)) return "";
    const entries = [];
    try {
      const models = fs.readdirSync(REPORTS_DIR);
      for (const model of models) {
        const modelDir = path.join(REPORTS_DIR, model);
        if (!fs.statSync(modelDir).isDirectory()) continue;
        const projects = fs.readdirSync(modelDir);
        for (const project of projects) {
          const reportFile = path.join(modelDir, project, "estimate-report.json");
          if (fs.existsSync(reportFile)) {
            const stat = fs.statSync(reportFile);
            entries.push(`${model}/${project}:${stat.mtimeMs}`);
          }
        }
      }
    } catch {
      // ignore read errors
    }
    return entries.sort().join("|");
  }

  function poll() {
    const current = getSnapshot();
    if (current !== lastSnapshot) {
      lastSnapshot = current;
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
  }

  return {
    name: "watch-benchmarks",
    configureServer(viteServer) {
      server = viteServer;

      // Initial generation
      try {
        aggregate();
        lastSnapshot = getSnapshot();
        console.log("[watch-benchmarks] Initial benchmark-summary.json generated");
      } catch (err) {
        console.error("[watch-benchmarks] Initial generation failed:", err.message);
      }

      // Poll for changes every 3 seconds
      pollTimer = setInterval(poll, POLL_INTERVAL);
      console.log(`[watch-benchmarks] Polling ${REPORTS_DIR} every ${POLL_INTERVAL / 1000}s`);
    },
    closeBundle() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
  };
}
