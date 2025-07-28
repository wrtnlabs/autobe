import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBePrisma,
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
  IAutoBePrismaValidation,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.254.json";

export const test_compiler_prisma_254 = async (
  factory: TestFactory,
): Promise<void> => {
  const app: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const valid: IAutoBePrismaValidation = await compiler.prisma.validate(app);
  if (valid.success === false) throw new Error("Prisma validation failed");

  const write = async (dbms: "postgres" | "sqlite"): Promise<void> => {
    const files: Record<string, string> = await compiler.prisma.write(
      app,
      dbms,
    );
    const result: IAutoBePrismaCompileResult = await compiler.prisma.compile({
      files,
    });
    if (result.type !== "success")
      await FileSystemIterator.save({
        root: `${TestGlobal.ROOT}/results/compiler/prisma/254/${dbms}`,
        files: files,
      });
    TestValidator.equals(dbms)(result.type)("success");
  };
  await write("postgres");
  await write("sqlite");
};
