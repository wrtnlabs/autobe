import { ArchiveStorage } from "@autobe/filesystem/src/ArchiveStorage";
import { IAutoBeTokenUsageJson } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";

const main = async (): Promise<void> => {
  for (const project of typia.misc.literals<TestProject>().sort()) {
    console.log("-------------------------------------------------");
    console.log(project.toUpperCase());
    console.log("-------------------------------------------------");
    for (const phase of [
      "analyze",
      "prisma",
      "interface",
      "test",
      "realize",
    ] as const) {
      const usage: IAutoBeTokenUsageJson = await ArchiveStorage.getTokenUsage({
        vendor: TestGlobal.vendorModel,
        project,
        phase,
      });
      console.log(`  - ${phase}: ${usage.aggregate.total.toLocaleString()}`);
    }
  }
};
main().catch(console.error);
