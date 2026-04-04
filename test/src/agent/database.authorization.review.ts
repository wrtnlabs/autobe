import { AutoBeExampleProject } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { prepare_database_agent } from "./internal/prepare_database_agent";
import { validate_database_authorization_review } from "./internal/validate_database_authorization_review";

const main = async () => {
  const project: AutoBeExampleProject = typia.assert<AutoBeExampleProject>(
    TestGlobal.getArguments("project")?.[0] ?? "todo",
  );
  await validate_database_authorization_review({
    agent: await prepare_database_agent({
      vendor: TestGlobal.vendorModel,
      project,
    }),
    vendor: TestGlobal.vendorModel,
    project,
  });
};
main().catch(console.log);
