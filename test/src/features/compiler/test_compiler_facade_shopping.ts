import { AutoBeCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import {
  IAutoBePrismaCompileResult,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";

export const test_compiler_facade_shopping = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: AutoBeCompiler = factory.createCompiler();
  const prisma: IAutoBePrismaCompileResult = await compiler.prisma.compile({
    files: await RepositoryFileSystem.prisma("samchon", "shopping-backend"),
  });
  if (prisma.type !== "success") {
    console.log(prisma);
    throw new Error("Failed to pass prisma generate");
  }

  const result: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: await RepositoryFileSystem.src("samchon", "shopping-backend"),
      prisma: prisma.nodeModules,
      package: "@samchon/shopping-api",
    });
  if (result.type !== "success") {
    console.log(result);
  }
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
