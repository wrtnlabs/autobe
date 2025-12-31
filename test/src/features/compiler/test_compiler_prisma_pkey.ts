import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeDatabase, IAutoBePrismaCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.pkey.json";

export const test_compiler_prisma_pkey = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const files: Record<string, string> = await compiler.writePrismaSchemas(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler.prisma.pkey`,
    files,
  });

  const compiled: IAutoBePrismaCompileResult =
    await compiler.compilePrismaSchemas({
      files,
    });
  TestValidator.equals("result", compiled.type, "success");
};
