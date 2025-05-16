import { AutoBePrismaCompiler } from "@autobe/compiler";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { FileSystemIterator } from "../../utils/FileSystemIterator";

export const test_compiler_prisma_correct = async (): Promise<void> => {
  const result: IAutoBePrismaCompilerResult =
    await new AutoBePrismaCompiler().compile({
      files: await FileSystemIterator.read({
        root: `${TestGlobal.ROOT}/assets/shopping/prisma/schema`,
        extension: "prisma",
        prefix: "",
      }),
    });
  TestValidator.equals("result")(result.type)("success");
  typia.assertEquals(result);
};
