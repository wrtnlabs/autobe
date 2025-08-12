import cp from "child_process";

import { TestGlobal } from "../TestGlobal";

const STEPS = ["analyze", "prisma", "interface", "test", "realize"];

const main = async () => {
  const project: string | undefined = TestGlobal.getArguments("project")[0];
  const from: string | undefined = TestGlobal.getArguments("from")[0];
  const to: string | undefined = TestGlobal.getArguments("to")[0];

  const postfix: string = project ? `_${project}` : "";
  const start: number = STEPS.indexOf(from);
  const end: number = to ? STEPS.indexOf(to) : STEPS.length;
  const execute = (step: string) =>
    cp.execSync(`pnpm start --include ${step}_main${postfix} --archive`, {
      stdio: "inherit",
      cwd: TestGlobal.ROOT,
    });
  STEPS.forEach((step, i) => {
    if (i < start) return;
    if (i > end) return;
    execute(step);
  });
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
