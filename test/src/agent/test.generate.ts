import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { prepare_test_agent } from "./internal/prepare_test_agent";
import { validate_test_generate } from "./internal/validate_test_generate";

const main = async () => {
  const project: AutoBeExampleProject = typia.assert<AutoBeExampleProject>(
    TestGlobal.getArguments("project")?.[0] ?? "todo",
  );
  await validate_test_generate({
    agent: await prepare_test_agent({
      vendor: TestGlobal.vendorModel,
      project,
    }),
    vendor: TestGlobal.vendorModel,
    project,
  });
};
main().catch(console.error);
