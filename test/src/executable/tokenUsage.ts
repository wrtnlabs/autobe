import { IAutoBeTokenUsageJson } from "@autobe/interface";
import typia from "typia";

import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";

const main = async (): Promise<void> => {
  for (const project of typia.misc.literals<TestProject>().sort()) {
    console.log("-------------------------------------------------");
    console.log(project.toUpperCase());
    console.log("-------------------------------------------------");
    for (const step of [
      "analyze",
      "prisma",
      "interface",
      "test",
      "realize",
    ] as const) {
      const usage: IAutoBeTokenUsageJson = await TestHistory.getTokenUsage(
        project,
        step,
      );
      console.log(`  - ${step}: ${usage.aggregate.total.toLocaleString()}`);
    }
  }
};
main().catch(console.error);
