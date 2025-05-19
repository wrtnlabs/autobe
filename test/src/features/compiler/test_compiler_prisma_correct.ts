import { AutoBePrismaCompiler } from "@autobe/compiler";
import { TestRepositoryUtil } from "@autobe/filesystem";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_compiler_prisma_correct = async (): Promise<void> => {
  const result: IAutoBePrismaCompilerResult =
    await new AutoBePrismaCompiler().compile({
      files: await TestRepositoryUtil.prisma("samchon", "shopping-backend"),
    });
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
