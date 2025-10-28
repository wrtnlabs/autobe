const cp = require("child_process");

console.log("Build system prompts");
const startTime = performance.now();
cp.execSync("pnpm run build:prompt", {
  cwd: `${__dirname}/../../packages/agent`,
  stdio: "inherit",
});
const duration = performance.now() - startTime;
if (duration > 100) {
  console.log(`${~~duration / 1000}s`);
} else {
  console.log(`${~~duration}ms`);
}
