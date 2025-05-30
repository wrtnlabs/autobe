import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./constraint.json";

export const test_compiler_prisma_constraint = async (): Promise<void> => {
  const compiler = new AutoBePrismaCompiler();
  const application = typia.assert<AutoBePrisma.IApplication>(json);
  const files = await compiler.write(application);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/constraint`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const validate = await compiler.validate(application);
  TestValidator.equals("gin index duplicated")(validate.success)(false);
};
