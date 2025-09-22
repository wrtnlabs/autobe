import { RepositoryFileSystem } from "@autobe/filesystem";
import {
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";

export const test_compiler_facade_bbs = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const prisma: IAutoBePrismaCompileResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma("samchon", "bbs-backend"),
  });
  if (prisma.type !== "success") {
    console.log(prisma.type === "failure" ? prisma.reason : prisma.error);
    throw new Error("Failed to pass prisma generate");
  }

  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: await RepositoryFileSystem.src("samchon", "bbs-backend"),
      prisma: prisma.nodeModules,
      package: "@samchon/bbs-api",
    });
  if (result.type === "failure") console.log(result.diagnostics);
  TestValidator.equals("result", result.type, "success");
  typia.assertEquals(result);
};
