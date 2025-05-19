import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_prisma_failure = async (): Promise<void> => {
  const result: IAutoBePrismaCompilerResult =
    await new AutoBePrismaCompiler().compile({
      files: {
        ...(await FileSystemIterator.read({
          root: `${TestGlobal.ROOT}/assets/shopping/prisma/schema`,
          extension: "prisma",
          prefix: "",
        })),
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
