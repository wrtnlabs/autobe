import { AutoBeCompiler } from "@autobe/compiler";
import {
  IAutoBePrismaCompilerResult,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestRepositoryUtil } from "../../utils/TestRepositoryUtil";

export const test_compiler_facade_shopping = async (): Promise<void> => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma({
    files: await TestRepositoryUtil.prisma("samchon", "shopping-backend"),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma generate");

  const result: IAutoBeTypeScriptCompilerResult = await compiler.typescript({
    files: await TestRepositoryUtil.src("samchon", "shopping-backend"),
    prisma: prisma.schemas,
    package: "@samchon/shopping-api",
  });
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
