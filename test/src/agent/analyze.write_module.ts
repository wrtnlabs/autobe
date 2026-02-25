import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { prepare_analyze_agent } from "./internal/prepare_analyze_agent";
import { validate_analyze_write_module } from "./internal/validate_analyze_write_module";

const main = async () => {
  const project: AutoBeExampleProject = typia.assert<AutoBeExampleProject>(
    TestGlobal.getArguments("project")?.[0] ?? "todo",
  );
  await validate_analyze_write_module({
    agent: await prepare_analyze_agent({
      vendor: TestGlobal.vendorModel,
      project,
    }),
    vendor: TestGlobal.vendorModel,
    project,
  });
};
main().catch(console.log);
