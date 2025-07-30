import cp from "child_process";

import { TestGlobal } from "../TestGlobal";

const STEPS = ["analyze", "prisma", "interface", "test"];

const main = async () => {
  const project: string | undefined = TestGlobal.getArguments("project")[0];
  const from: string | undefined = TestGlobal.getArguments("from")[0];

  const postfix: string = project ? `_${project}` : "";
  const index: number = STEPS.indexOf(from);
  const execute = (step: string) =>
    cp.execSync(`pnpm start --include ${step}_main${postfix} --archive`, {
      stdio: "inherit",
      cwd: TestGlobal.ROOT,
    });
  STEPS.forEach((step, i) => {
    if (i < index) return;
    execute(step);
  });
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
