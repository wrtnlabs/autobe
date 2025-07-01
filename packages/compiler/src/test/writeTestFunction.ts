import { AutoBeOpenApi, IAutoBeTestCompilerProps } from "@autobe/interface";
import { NestiaMigrateImportProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateImportProgrammer";
import ts, { FunctionDeclaration } from "typescript";

import { FilePrinter } from "../utils/FilePrinter";
import { writeTestStatement } from "./writeTestStatement";

interface WriteTestContext {
  importer: NestiaMigrateImportProgrammer;
  document: AutoBeOpenApi.IDocument;
}

export function writeTestFunction(props: IAutoBeTestCompilerProps): string {
  const ctx: WriteTestContext = {
    importer: new NestiaMigrateImportProgrammer(),
    document: props.document,
  };
  const decla: FunctionDeclaration = ts.factory.createFunctionDeclaration(
    [
      ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
      ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
    ],
    undefined,
    props.scenario.functionName,
    undefined,
    [],
    undefined,
    ts.factory.createBlock(
      props.function.statements
        .map((stmt) => writeTestStatement(ctx, stmt))
        .flat(),
      true,
    ),
  );
  return FilePrinter.write({
    statements: [
      ...ctx.importer.toStatements(
        (key) => `@ORGANIZATION/${key}-api/lib/structures/${key}`,
      ),
      FilePrinter.newLine(),
      FilePrinter.description(decla, props.scenario.draft),
    ],
  });
}
