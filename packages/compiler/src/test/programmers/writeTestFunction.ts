import { AutoBeOpenApi, IAutoBeTestWriteProps } from "@autobe/interface";
import {
  AutoBeEndpointComparator,
  transformOpenApiDocument,
} from "@autobe/utils";
import { NestiaMigrateImportProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateImportProgrammer";
import { HttpMigration, IHttpMigrateApplication } from "@samchon/openapi";
import { HashMap, Pair } from "tstl";
import ts, { FunctionDeclaration } from "typescript";

import { FilePrinter } from "../../utils/FilePrinter";
import { AutoBeTestStatementProgrammer } from "./AutoBeTestStatementProgrammer";
import { IAutoBeTestApiFunction } from "./IAutoBeTestApiFunction";
import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";

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
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        "connection",
        undefined,
        ts.factory.createTypeReferenceNode(
          `${ctx.importer.external({
            type: "default",
            name: "api",
            library: `@ORGANIZATION/PROJECT-api`,
          })}.IConnection`,
        ),
      ),
    ],
    undefined,
    AutoBeTestStatementProgrammer.block(ctx, {
      type: "block",
      statements: props.function.statements,
    }),
  );
  return FilePrinter.write({
    statements: [
      ...ctx.importer.toStatements(
        (key) => `@ORGANIZATION/PROJECT-api/lib/structures/${key}`,
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
      accessor: "api.functional." + route.accessor.join("."),
      operation: operations.get(endpoint),
    });
  }
  return functions;
}
