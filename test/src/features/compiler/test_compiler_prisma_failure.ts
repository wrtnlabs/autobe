import { AutoBePrismaCompiler } from "@autobe/compiler";
import { RepositoryFileSystem } from "@autobe/filesystem";
import { IAutoBePrismaCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_compiler_prisma_failure = async (): Promise<void> => {
  const result: IAutoBePrismaCompileResult =
    await new AutoBePrismaCompiler().compile({
      files: {
        ...(await RepositoryFileSystem.prisma("samchon", "shopping-backend")),
        "invalid.prisma": ["ASDFGHJ", "ZXCVBNM"].join("\n\n"),
      },
    });
  TestValidator.predicate("result")(
    () =>
      result.type === "failure" &&
      result.reason.includes("ASDFGHJ") &&
      result.reason.includes("ZXCVBNM"),
  );
  typia.assertEquals(result);
};
