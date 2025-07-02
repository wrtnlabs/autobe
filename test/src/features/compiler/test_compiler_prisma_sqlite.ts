import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeHistory,
  AutoBePrismaHistory,
  IAutoBePrismaCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";

export const test_compiler_prisma_sqlite = async () => {
  await validate("bbs-backend");
  await validate("shopping-backend");
};

const validate = async (
  type: Parameters<typeof TestHistory.getPrisma>[0],
): Promise<void> => {
  const histories: AutoBeHistory[] = await TestHistory.getPrisma(type);
  const prisma: AutoBePrismaHistory | undefined = histories.find(
    (h) => h.type === "prisma",
  );
  if (prisma === undefined) throw new Error("Prisma history not found");

  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const files: Record<string, string> = await compiler.write(
    prisma.result.data,
    "sqlite",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/sqlite/${type}`,
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, value]),
    ),
  });

  const result: IAutoBePrismaCompileResult = await compiler.compile({
    files,
  });
  TestValidator.equals("result")(result.type)("success");
};
