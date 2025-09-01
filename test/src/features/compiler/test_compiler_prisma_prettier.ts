import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBePrisma, IAutoBeCompiler } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.application.json";

export const test_compiler_prisma_prettier = async (
  factory: TestFactory,
): Promise<void> => {
  const app: AutoBePrisma.IApplication =
    typia.assert<AutoBePrisma.IApplication>(json);
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const schemas: Record<string, string> = await compiler.prisma.write(app);
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/prisma/prettier`,
    files: schemas,
  });

  for (const [key, value] of Object.entries(schemas))
    TestValidator.predicate(
      key,
      value
        .split("\n")
        .every((line) => line.startsWith("///") === false || line.length <= 80),
    );
};
