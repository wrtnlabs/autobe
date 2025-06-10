import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.constraint.json";

export const test_compiler_prisma_constraint = async (): Promise<void> => {
  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const application: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);

  const files: Record<string, string> = await compiler.write(application);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/constraint`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const validate: IAutoBePrismaValidation =
    await compiler.validate(application);
  TestValidator.equals("gin index duplicated")(validate.success)(false);
};
