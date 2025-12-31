import { AutoBeExampleStorage } from "@autobe/benchmark";
import { IAutoBeTokenUsageJson } from "@autobe/interface";
import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  for (const project of typia.misc.literals<AutoBeExampleProject>().sort()) {
    console.log("-------------------------------------------------");
    console.log(project.toUpperCase());
    console.log("-------------------------------------------------");
    for (const phase of [
      "analyze",
      "database",
      "interface",
      "test",
      "realize",
    ] as const) {
      const usage: IAutoBeTokenUsageJson =
        await AutoBeExampleStorage.getTokenUsage({
          vendor: TestGlobal.vendorModel,
          project,
          phase,
        });
      console.log(`  - ${phase}: ${usage.aggregate.total.toLocaleString()}`);
    }
  }
};
main().catch(console.error);
