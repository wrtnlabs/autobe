import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { prepare_interface_agent } from "./internal/prepare_interface_agent";
import { validate_interface_operation } from "./internal/validate_interface_operation";

const main = async () => {
  const project: AutoBeExampleProject = typia.assert<AutoBeExampleProject>(
    TestGlobal.getArguments("project")?.[0] ?? "todo",
  );
  await validate_interface_operation({
    agent: await prepare_interface_agent({
      vendor: TestGlobal.vendorModel,
      project,
    }),
    vendor: TestGlobal.vendorModel,
    project,
  });
  console.log("completed");
};
main().catch(console.log);
