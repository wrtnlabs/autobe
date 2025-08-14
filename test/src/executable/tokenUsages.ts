import { AutoBeEventSnapshot } from "@autobe/interface";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const DIRECTORY = `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1`;

const main = async (): Promise<void> => {
  type Step = "analyze" | "prisma" | "interface" | "test" | "realize";
  const read = async (step: Step): Promise<AutoBeEventSnapshot[]> => {
    const content: string = await fs.promises.readFile(
      `${DIRECTORY}/bbs-backend.${step}.snapshots.json`,
      "utf8",
    );
    return JSON.parse(content);
  };
  for (const step of typia.misc.literals<Step>()) {
    const snapshots: AutoBeEventSnapshot[] = await read(step);
    console.log(step, snapshots[0].tokenUsage.aggregate.total);
  }
};
main().catch(console.error);
