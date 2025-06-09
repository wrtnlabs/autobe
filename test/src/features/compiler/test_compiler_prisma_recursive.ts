import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/recursive.json";

export const test_compiler_prisma_recursive = async (): Promise<void> => {
  const compiler = new AutoBePrismaCompiler();
  const application = typia.assert<AutoBePrisma.IApplication>(json);
  const files = await compiler.write(application);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/recursive`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const compiled = await compiler.compile({ files });
  TestValidator.equals("comile result")(compiled.type)("success");
};
