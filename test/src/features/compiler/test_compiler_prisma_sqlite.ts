import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeDatabaseHistory,
  AutoBeHistory,
  IAutoBePrismaCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_prisma_sqlite = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "database",
    })) === false
  )
    return false;

  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: TestGlobal.vendorModel,
    project: "todo",
    phase: "database",
  });
  const prisma: AutoBeDatabaseHistory | undefined = histories.find(
    (h) => h.type === "database",
  );
  if (prisma === undefined) throw new Error("Prisma history not found");

  const compiler: AutoBeDatabaseCompiler = new AutoBeDatabaseCompiler();
  const files: Record<string, string> = await compiler.writePrismaSchemas(
    prisma.result.data,
    "sqlite",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/sqlite/todo-backend`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const result: IAutoBePrismaCompileResult =
    await compiler.compilePrismaSchemas({
      files,
    });
  TestValidator.equals("result", result.type, "success");
};
