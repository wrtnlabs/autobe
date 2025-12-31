import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeDatabase, IAutoBePrismaCompileResult } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.one-to-one.json";

export const test_compiler_prisma_one_to_one = async (): Promise<void> => {
  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const application: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);

  const files: Record<string, string> = await compiler.writePrismaSchemas(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler.prisma.one-to-one`,
    files,
  });

  const compiled: IAutoBePrismaCompileResult =
    await compiler.compilePrismaSchemas({
      files,
    });
  console.log(compiled.type);
};
