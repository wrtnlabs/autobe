import {
  IAutoBeRouteDocument,
  IAutoBeRouteOperation,
  IAutoBeRouteParameter,
} from "@autobe/interface";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiTypeChecker,
} from "@samchon/openapi";

export function invertOpenApiDocument(
  document: OpenApi.IDocument,
): IAutoBeRouteDocument {
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
            description: r.operation().description ?? empty("description"),
            parameters: r.parameters.map(
              (p) =>
                ({
                  name: p.name,
                  description: p.parameter().description ?? "",
                  schema: p.schema as any,
                }) satisfies IAutoBeRouteParameter,
            ),
            body:
              r.body?.type === "application/json" &&
              OpenApiTypeChecker.isReference(r.body.schema)
                ? {
                    description: r.body.description() ?? empty("description"),
                    typeName: r.body.schema.$ref.split("/").pop()!,
                  }
                : null,
            response:
              r.success?.type === "application/json" &&
              OpenApiTypeChecker.isReference(r.success.schema)
                ? {
                    description:
                      r.success.description() ?? empty("description"),
                    typeName: r.success.schema.$ref.split("/").pop()!,
                  }
                : null,
          }) satisfies IAutoBeRouteOperation,
      ),
    components: document.components,
  };
}

function empty(key: string): string {
  return `Describe ${key} as much as possible with clear and concise words.`;
}
