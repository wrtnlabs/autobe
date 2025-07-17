import { AutoBeOpenApi } from "@autobe/interface";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiTypeChecker,
} from "@samchon/openapi";

export function invertOpenApiDocument(
  document: OpenApi.IDocument,
): AutoBeOpenApi.IDocument {
  const app: IHttpMigrateApplication = HttpMigration.application(document);
  return {
    operations: app.routes
      .filter((r) => r.query === null)
      .map(
        (r) =>
          ({
            specification: empty("specification"),
            method: r.method as "post",
            path: r.path,
            summary: r.operation().summary ?? empty("summary"),
            description: r.operation().description ?? empty("description"),
            parameters: r.parameters.map(
              (p) =>
                ({
                  name: p.name,
                  description:
                    p.parameter().description ?? empty("description"),
                  schema: p.schema as any,
                }) satisfies AutoBeOpenApi.IParameter,
            ),
            requestBody:
              r.body?.type === "application/json" &&
              OpenApiTypeChecker.isReference(r.body.schema)
                ? {
                    description: r.body.description() ?? empty("description"),
                    typeName: r.body.schema.$ref.split("/").pop()!,
                  }
                : null,
            responseBody:
              r.success?.type === "application/json" &&
              OpenApiTypeChecker.isReference(r.success.schema)
                ? {
                    description:
                      r.success.description() ?? empty("description"),
                    typeName: r.success.schema.$ref.split("/").pop()!,
                  }
                : null,
            authorizationRoles: null,
          }) satisfies AutoBeOpenApi.IOperation,
      ),
    components: {
      schemas: (document.components?.schemas ?? {}) as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >,
    },
  };
}

function empty(key: string): string {
  return `Describe ${key} as much as possible with clear and concise words.`;
}
