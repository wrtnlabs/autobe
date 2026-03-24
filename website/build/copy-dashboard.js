const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../../apps/dashboard-ui/dist");
const dest = path.resolve(__dirname, "../public/benchmark");

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(srcPath);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      fs.symlinkSync(target, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(src)) {
  console.warn("[copy-dashboard] dashboard-ui dist not found, skipping");
  process.exit(0);
}

// Preserve benchmark-summary.json across rebuilds
const summaryPath = path.join(dest, "benchmark-summary.json");
let savedSummary = null;
if (fs.existsSync(summaryPath)) {
  savedSummary = fs.readFileSync(summaryPath);
}

// Clean destination first
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

copyDir(src, dest);

// Restore benchmark-summary.json if dist didn't include one
if (savedSummary && !fs.existsSync(summaryPath)) {
  fs.writeFileSync(summaryPath, savedSummary);
  console.log("[copy-dashboard] restored existing benchmark-summary.json");
}

console.log("[copy-dashboard] copied dashboard-ui dist → public/benchmark/");
