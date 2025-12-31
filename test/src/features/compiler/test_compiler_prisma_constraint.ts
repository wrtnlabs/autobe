import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeDatabase, IAutoBeDatabaseValidation } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.constraint.json";

export const test_compiler_prisma_constraint = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const files: Record<string, string> = await compiler.writePrismaSchemas(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/constraint`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const validate: IAutoBeDatabaseValidation =
    await compiler.validate(application);
  TestValidator.equals("gin index duplicated", validate.success, false);
};
