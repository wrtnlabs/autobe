import { AutoBeOpenApi } from "@autobe/interface";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3_1,
} from "@samchon/openapi";
import { HashMap } from "tstl";

import { StringUtil } from "../StringUtil";
import { AutoBeOpenApiEndpointComparator } from "./AutoBeOpenApiEndpointComparator";
import { AutoBeOpenApiTypeChecker } from "./AutoBeOpenApiTypeChecker";

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
      summary: StringUtil.summary(op.description),
      description:
        op.description +
        (op.authorizationType !== null &&
        op.responseBody?.typeName.endsWith(".IAuthorized") === true
          ? "\n\n@setHeader token.access Authorization"
          : ""),
      parameters: op.parameters.map((p) => ({
        name: p.name,
        in: "path",
        schema: transformSchema(p.schema),
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
      ...{
        "x-autobe-prerequisites": op.prerequisites,
        "x-samchon-accessor": op.accessor,
      },
    };
  }

  const result: OpenApi.IDocument = OpenApi.convert({
    openapi: "3.1.0",
    paths,
    components: {
      schemas: Object.fromEntries(
        Object.entries(document.components.schemas).map(([key, schema]) => [
          key,
          transformSchema(schema),
        ]),
      ),
    },
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

const transformSchema = (
  schema: AutoBeOpenApi.IJsonSchema,
): OpenApi.IJsonSchema => {
  if (
    AutoBeOpenApiTypeChecker.isConst(schema) ||
    AutoBeOpenApiTypeChecker.isReference(schema)
  )
    return {
      ...schema,
      type: undefined,
    };
  else if (AutoBeOpenApiTypeChecker.isOneOf(schema))
    return {
      ...schema,
      oneOf: schema.oneOf.map((sub) => transformSchema(sub)),
      type: undefined,
    };
  else if (AutoBeOpenApiTypeChecker.isArray(schema))
    return {
      ...schema,
      items: transformSchema(schema.items),
    };
  else if (AutoBeOpenApiTypeChecker.isObject(schema))
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [
          key,
          transformSchema(value),
        ]),
      ),
      additionalProperties:
        typeof schema.additionalProperties === "object" &&
        schema.additionalProperties !== null
          ? transformSchema(schema.additionalProperties)
          : schema.additionalProperties,
    };
  return schema;
};
