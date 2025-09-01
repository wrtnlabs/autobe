import { AutoBePrismaCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import { IAutoBePrismaCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_compiler_prisma_correct = async (): Promise<void> => {
  const result: IAutoBePrismaCompileResult =
    await new AutoBePrismaCompiler().compile({
      files: await RepositoryFileSystem.prisma("samchon", "shopping-backend"),
    });
  TestValidator.equals("result", result.type, "success");
  typia.assertEquals(result);
};
