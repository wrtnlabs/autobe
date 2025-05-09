import { AutoBePrismaCompiler } from "@autobe/compiler";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

export const test_compiler_prisma_failure = async (): Promise<void> => {
  const result: IAutoBePrismaCompilerResult =
    await new AutoBePrismaCompiler().compile({
      files: {
        "schema.prisma": [
          await fs.promises.readFile(
            `${TestGlobal.ROOT}/assets/schema.prisma`,
            "utf8",
          ),
          "ASDFGHJ",
          "ZXCVBNM",
        ].join("\n\n"),
      },
    });
  TestValidator.predicate("result")(
    () =>
      result.type === "failure" &&
      result.reason.includes("ASDFGHJ") &&
      result.reason.includes("ZXCVBNM"),
  );
};
