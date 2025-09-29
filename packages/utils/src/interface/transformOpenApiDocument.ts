import { AutoBeOpenApi } from "@autobe/interface";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3_1,
} from "@samchon/openapi";
import { HashMap } from "tstl";

import { AutoBeOpenApiEndpointComparator } from "./AutoBeOpenApiEndpointComparator";

export function transformOpenApiDocument(
  document: AutoBeOpenApi.IDocument,
): OpenApi.IDocument {
  const dict: HashMap<AutoBeOpenApi.IEndpoint, string> = new HashMap(
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  );
  const paths: Record<string, OpenApi.IPath> = {};

  for (const op of document.operations) {
    dict.set(op, op.name);
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      summary: op.summary,
      description:
        op.description +
        (op.authorizationType !== null &&
        op.responseBody?.typeName.endsWith(".IAuthorized") === true
          ? "\n\n@setHeader token.access Authorization"
          : ""),
      parameters: op.parameters.map((p) => ({
        name: p.name,
        in: "path",
        schema: p.schema,
        description: p.description,
        required: true,
      })),
      requestBody: op.requestBody
        ? {
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${op.requestBody.typeName}`,
                },
              },
            },
            description: op.requestBody.description,
            required: true,
          }
        : undefined,
      responses: op.responseBody
        ? {
            [op.method === "post" ? 201 : 200]: {
              content: {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${op.responseBody.typeName}`,
                  },
                },
              },
              description: op.responseBody.description,
            },
          }
        : undefined,
    };
  }

  const result: OpenApi.IDocument = OpenApi.convert({
    openapi: "3.1.0",
    paths,
    components: document.components,
  } as OpenApiV3_1.IDocument);
  const migrate: IHttpMigrateApplication = HttpMigration.application(result);
  migrate.routes.forEach((r) => {
    if (r.method === "head") return;
    const name: string = dict.get({
      method: r.method,
      path: r.path,
    });
    if (r.accessor.length >= 2 && r.accessor.at(-2) === name) r.accessor.pop();
    r.accessor[r.accessor.length - 1] = name;
    r.operation()["x-samchon-accessor"] = r.accessor;
  });
  return result;
}
