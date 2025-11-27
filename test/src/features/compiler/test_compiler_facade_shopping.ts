import { FileSystemIterator, RepositoryFileSystem } from "@autobe/filesystem";
import {
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";

export const test_compiler_facade_shopping = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const prisma: IAutoBePrismaCompileResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma("samchon", "shopping-backend"),
  });
  if (prisma.type !== "success") {
    console.log(prisma);
    throw new Error("Failed to pass prisma generate");
  }

  const files: Record<string, string> = await RepositoryFileSystem.src(
    "samchon",
    "shopping-backend",
  );
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler.realize.facade`,
    files: {
      ...files,
      ...prisma.client,
    },
  });

  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files,
      prisma: prisma.client,
      package: "@samchon/shopping-api",
    });
  if (result.type !== "success") {
    console.log(result);
  }
  TestValidator.equals("result", result.type, "success");
  typia.assertEquals(result);
};
