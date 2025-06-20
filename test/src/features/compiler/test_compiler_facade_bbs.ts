import { AutoBeCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import {
  IAutoBePrismaCompilerResult,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_compiler_facade_bbs = async (): Promise<void> => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma("samchon", "bbs-backend"),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma generate");

  const result: IAutoBeTypeScriptCompilerResult =
    await compiler.typescript.compile({
      files: await RepositoryFileSystem.src("samchon", "bbs-backend"),
      prisma: prisma.nodeModules,
      package: "@samchon/bbs-api",
    });
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
