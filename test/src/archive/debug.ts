import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeRealizeCompleteEvent,
} from "@autobe/interface";
import cp from "child_process";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const project: string | undefined = TestGlobal.getArguments("project")?.[0];
  typia.assertGuard<AutoBeExampleProject>(project);

  const snapshots: AutoBeEventSnapshot[] =
    await AutoBeExampleStorage.getSnapshots({
      project,
      phase: "realize",
      vendor: TestGlobal.vendorModel,
    });
  const event: AutoBeRealizeCompleteEvent | undefined = snapshots
    .map((s) => s.event)
    .find((e) => e.type === "realizeComplete");
  if (event === undefined) return;

  console.log(event.compiled);
  if (event.compiled.type === "failure") {
    cp.execSync(
      `pnpm archive:local --vendor ${TestGlobal.vendorModel} --project ${project}`,
      {
        stdio: "inherit",
        cwd: TestGlobal.ROOT,
      },
    );
    cp.execSync(`pnpm install`, {
      stdio: "inherit",
      cwd: AutoBeExampleStorage.getDirectory({
        vendor: TestGlobal.vendorModel,
        project,
      }),
    });
    console.log(
      `code results/${AutoBeExampleStorage.slugModel(
        TestGlobal.vendorModel,
        false,
      )}/${project}/realize`,
    );
  }
};
main().catch(console.error);

// pnpm archive:debug --vendor qwen/qwen3.5-122b-a10b --project bbs
// pnpm archive:debug --vendor
