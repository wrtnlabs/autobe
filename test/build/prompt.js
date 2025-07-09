const cp = require("child_process");

console.log("Build system prompts");
cp.execSync("pnpm run build:prompt", {
  cwd: `${__dirname}/../../packages/agent`,
  stdio: "ignore",
});
