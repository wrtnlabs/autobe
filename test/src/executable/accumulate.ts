import { AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeEventSnapshot, IAutoBeTokenUsageJson } from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

const readSnapshots = async (
  project: TestProject,
  step: string,
): Promise<AutoBeEventSnapshot[]> => {
  const content: string = await fs.promises.readFile(
    `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/${project}.${step}.snapshots.json`,
    "utf-8",
  );
  return JSON.parse(content);
};

const accumulate = async (
  project: TestProject,
  from: string,
  to: string,
): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = await readSnapshots(project, to);
  const top: IAutoBeTokenUsageJson | undefined = snapshots[0]?.tokenUsage;
  if (top === undefined) return;
  else if (
    top.analyze.total +
      top.facade.total +
      top.interface.total +
      top.prisma.total +
      top.realize.total +
      top.test.total !==
    0
  )
    return;

  const base: AutoBeTokenUsage = new AutoBeTokenUsage(
    (await readSnapshots(project, from)).at(-1)!.tokenUsage,
  );
  snapshots.forEach((s) => {
    const accumulated: AutoBeTokenUsage = AutoBeTokenUsage.plus(
      base,
      new AutoBeTokenUsage(s.tokenUsage),
    );
    s.tokenUsage = accumulated.toJSON();
  });
  await fs.promises.writeFile(
    `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/${project}.${to}.snapshots.json`,
    JSON.stringify(snapshots),
    "utf8",
  );
};

const main = async (): Promise<void> => {
  for (const project of ["bbs-backend", "shopping-backend"] as const) {
    await accumulate(project, "analyze", "prisma");
    await accumulate(project, "prisma", "interface");
    await accumulate(project, "interface", "test");
    await accumulate(project, "test", "realize");
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
