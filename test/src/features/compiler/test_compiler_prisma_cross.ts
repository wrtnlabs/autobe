import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { AutoBeDatabase, IAutoBeDatabaseValidation } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import json from "./examples/prisma.cross.json";

export const test_compiler_prisma_cross = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const result: IAutoBeDatabaseValidation =
    await compiler.validate(application);
  TestValidator.equals("result", result.success, false);
};
