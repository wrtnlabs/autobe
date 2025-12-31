import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeDatabase, IAutoBePrismaCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.unique.json";

export const test_compiler_prisma_unique = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const files: Record<string, string> = await compiler.writePrismaSchemas(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/unique`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const compiled: IAutoBePrismaCompileResult =
    await compiler.compilePrismaSchemas({
      files,
    });
  if (compiled.type === "failure")
    await fs.promises.writeFile(
      `${TestGlobal.ROOT}/results/compiler/prisma/unique/reason.log`,
      compiled.reason,
    );
  TestValidator.equals("compile result", compiled.type, "success");
};
