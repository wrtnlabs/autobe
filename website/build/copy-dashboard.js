const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../../apps/dashboard-ui/dist");
const dest = path.resolve(__dirname, "../public/benchmark");

// Only copy benchmark-summary.json from dashboard-ui dist.
// The old SPA (index.html + assets/) is no longer needed —
// /benchmark is now a native Nextra page.

fs.mkdirSync(dest, { recursive: true });

const srcSummary = path.join(src, "benchmark-summary.json");
const destSummary = path.join(dest, "benchmark-summary.json");

if (fs.existsSync(srcSummary)) {
  fs.copyFileSync(srcSummary, destSummary);
  console.log("[copy-dashboard] copied benchmark-summary.json");
} else if (!fs.existsSync(destSummary)) {
  console.warn("[copy-dashboard] benchmark-summary.json not found in dist or dest");
}
