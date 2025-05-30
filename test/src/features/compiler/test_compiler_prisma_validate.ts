import { AutoBePrismaCompiler } from "@autobe/compiler";
import { IAutoBePrismaValidation } from "@autobe/interface";
import typia from "typia";

import json from "./application.json";

export const test_compiler_prisma_validate = async (): Promise<void> => {
  const { data: application } = typia.assert<IAutoBePrismaValidation>(json);
  application.files = application.files.filter(
    (file) => file.filename !== "main.prisma",
  );

  const compiler: AutoBePrismaCompiler = new AutoBePrismaCompiler();
  const again: IAutoBePrismaValidation = await compiler.validate(application);
  if (again.success === false) console.log(again.errors);
};
