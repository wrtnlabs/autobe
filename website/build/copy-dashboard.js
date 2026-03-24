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

// Clean destination first
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

copyDir(src, dest);
console.log("[copy-dashboard] copied dashboard-ui dist → public/benchmark/");
