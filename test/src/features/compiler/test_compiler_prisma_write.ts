import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma, IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.application.json";

export const test_compiler_prisma_write = async (): Promise<void> => {
  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const application: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);

  const files: Record<string, string> = await compiler.write(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/write`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const compiled: IAutoBePrismaCompilerResult = await compiler.compile({
    files,
  });
  TestValidator.equals("compile result")(compiled.type)("success");
};
