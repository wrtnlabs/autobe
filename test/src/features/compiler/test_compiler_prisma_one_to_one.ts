import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma, IAutoBePrismaCompileResult } from "@autobe/interface";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.one-to-one.json";

export const test_compiler_prisma_one_to_one = async (): Promise<void> => {
  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const application: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);

  const files: Record<string, string> = await compiler.write(
    application,
    "postgres",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler.prisma.one-to-one`,
    files,
  });

  const compiled: IAutoBePrismaCompileResult = await compiler.compile({
    files,
  });
  console.log(compiled.type);
};
