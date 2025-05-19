import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi, OpenApiV3_1 } from "@samchon/openapi";

export function createOpenApiDocument(
  route: AutoBeOpenApi.IDocument,
): OpenApi.IDocument {
  const paths: Record<string, OpenApi.IPath> = {};
  for (const op of route.operations) {
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      description: op.description,
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
                  $ref: `#.components/schemas/${op.requestBody.typeName}`,
                },
              },
            },
            description: op.description,
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
              description: op.description,
            },
          }
        : undefined,
    };
  }
  return OpenApi.convert({
    openapi: "3.1.0",
    paths,
    components: route.components,
  } as OpenApiV3_1.IDocument);
}
