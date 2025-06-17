import { AutoBePrismaCompiler } from "@autobe/compiler";
import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import json from "./examples/prisma.gin.json";

export const test_compiler_prisma_gin = async (): Promise<void> => {
  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const application: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);

  const result: IAutoBePrismaValidation = await compiler.validate(application);
  TestValidator.equals("result")(result.success)(false);
};
