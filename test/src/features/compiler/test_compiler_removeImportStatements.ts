import { AutoBeCompiler } from "@autobe/compiler";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_removeImportStatements = async () => {
  const compiler: AutoBeCompiler = new AutoBeCompiler({
    realize: {
      test: {
        onOperation: async () => {},
        onReset: async () => {},
      },
    },
  });
  const result: string =
    await compiler.typescript.removeImportStatements(SCRIPT);
  TestValidator.predicate(
    "no import",
    () => result.includes("import") === false,
  );
};

const SCRIPT = StringUtil.trim`
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeDatabase,
  IAutoBeCompiler,
  IAutoBePrismaCompileResult,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import json from "./examples/prisma.254.json";

export const test_compiler_prisma_254 = async (
  factory: TestFactory,
): Promise<void> => {
  const app: AutoBeDatabase.IApplication =
    typia.assert<AutoBeDatabase.IApplication>(json);
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const valid: IAutoBeDatabaseValidation = await compiler.prisma.validate(app);
  if (valid.success === false) throw new Error("Prisma validation failed");

  const write = async (dbms: "postgres" | "sqlite"): Promise<void> => {
    const files: Record<string, string> = await compiler.prisma.write(
      app,
      dbms,
    );
    const result: IAutoBePrismaCompileResult = await compiler.prisma.compile({
      files,
    });
    if (result.type !== "success") {
      console.log(result.type === "exception" ? result.error : result.reason);
      await FileSystemIterator.save({
        root: \`\${TestGlobal.ROOT}/results/compiler/prisma/254/\${dbms}\`,
        files: files,
      });
    }
    TestValidator.equals(dbms, result.type, "success");
  };
  await write("postgres");
  await write("sqlite");
};
`;
