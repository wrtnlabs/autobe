import { AutoBePrismaCompiler } from "@autobe/compiler";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_prisma_correct = async (): Promise<void> => {
  const result: IAutoBePrismaCompilerResult =
    await new AutoBePrismaCompiler().compile({
      files: {
        "schema.prisma": await fs.promises.readFile(
          `${TestGlobal.ROOT}/assets/schema.prisma`,
          "utf8",
        ),
      },
    });
  TestValidator.equals("result")(result.type)("success");
};
