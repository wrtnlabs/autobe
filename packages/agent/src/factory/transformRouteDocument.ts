import { IAutoBeRouteDocument } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";

export function transformRouteDocument(
  route: IAutoBeRouteDocument,
): OpenApi.IDocument {
  const paths: Record<string, OpenApi.IPath> = {};
  for (const op of route.operations) {
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      parameters: op.parameters.map((p) => ({
        name: p.name,
        in: "path",
        schema: p.schema,
        description: p.description,
        required: true,
      })),
      requestBody: op.body
        ? {
            content: {
              "application/json": {
                schema: op.body.schema,
              },
            },
            description: op.description,
            required: true,
          }
        : undefined,
      responses: op.response
        ? {
            [op.method === "post" ? 201 : 200]: {
              content: {
                "application/json": {
                  schema: op.response.schema,
                },
              },
              description: op.description,
            },
          }
        : undefined,
    };
  }
  return {
    openapi: "3.1.0",
    paths,
    components: route.components,
    "x-samchon-emended-v4": true,
  };
}
