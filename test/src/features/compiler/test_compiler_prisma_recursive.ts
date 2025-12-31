import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeDatabase, IAutoBePrismaCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.recursive.json";

export const test_compiler_prisma_recursive = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const files: Record<string, string> = await compiler.writePrismaSchemas(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/recursive`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const compiled: IAutoBePrismaCompileResult =
    await compiler.compilePrismaSchemas({
      files,
    });
  TestValidator.equals("compile result", compiled.type, "success");
};
