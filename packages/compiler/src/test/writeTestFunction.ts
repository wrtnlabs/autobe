import { AutoBeOpenApi, IAutoBeTestWriteProps } from "@autobe/interface";
import { NestiaMigrateImportProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateImportProgrammer";
import { HttpMigration, IHttpMigrateApplication } from "@samchon/openapi";
import { HashMap, Pair } from "tstl";
import ts, { FunctionDeclaration } from "typescript";

import { AutoBeEndpointComparator } from "../interface/AutoBeEndpointComparator";
import { transformOpenApiDocument } from "../interface/transformOpenApi";
import { FilePrinter } from "../utils/FilePrinter";
import { IAutoBeTestApiFunction } from "./IAutoBeTestApiFunction";
import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestStatement } from "./writeTestStatement";

export function writeTestFunction(props: IAutoBeTestWriteProps): string {
  const ctx: IAutoBeTestProgrammerContext = {
    importer: new NestiaMigrateImportProgrammer(),
    document: props.document,
    endpoints: associate(props.document),
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

function associate(
  document: AutoBeOpenApi.IDocument,
): HashMap<AutoBeOpenApi.IEndpoint, IAutoBeTestApiFunction> {
  // associate operations and functions
  const operations: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      document.operations.map(
        (o) =>
          new Pair(
            {
              method: o.method,
              path: o.path,
            },
            o,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
  const functions: HashMap<AutoBeOpenApi.IEndpoint, IAutoBeTestApiFunction> =
    new HashMap(
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );

  // from migrate application
  const migrate: IHttpMigrateApplication = HttpMigration.application(
    transformOpenApiDocument(document),
  );
  for (const route of migrate.routes) {
    const endpoint: AutoBeOpenApi.IEndpoint = {
      path: route.path,
      method: route.method as "get",
    };
    functions.emplace(endpoint, {
      accessor: "api." + route.accessor.join("."),
      operation: operations.get(endpoint),
    });
  }
  return functions;
}
