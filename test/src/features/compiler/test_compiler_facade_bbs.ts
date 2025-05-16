import { AutoBeCompiler } from "@autobe/compiler";
import {
  IAutoBePrismaCompilerResult,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestRepositoryUtil } from "../../utils/TestRepositoryUtil";

export const test_compiler_facade_bbs = async (): Promise<void> => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const prisma: IAutoBePrismaCompilerResult = await compiler.prisma({
    files: await TestRepositoryUtil.prisma("samchon", "bbs-backend"),
  });
  if (prisma.type !== "success")
    throw new Error("Failed to pass prisma generate");

  const result: IAutoBeTypeScriptCompilerResult = await compiler.typescript({
    files: await TestRepositoryUtil.src("samchon", "bbs-backend"),
    prisma: prisma.schemas,
    package: "@samchon/bbs-api",
  });
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
