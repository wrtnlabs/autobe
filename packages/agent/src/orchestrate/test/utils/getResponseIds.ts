import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";

export const getResponseIds = (props: {
  document: AutoBeOpenApi.IDocument;
  operation: AutoBeOpenApi.IOperation;
}): string[] => {
  const result: Set<string> = new Set();
  const emplace = (key: string) => {
    if (key.endsWith("_id") || key.endsWith("Id")) result.add(key);
  };

  if (props.operation.responseBody) {
    OpenApiTypeChecker.visit({
      components: props.document.components,
      schema: { $ref: props.operation.responseBody.typeName },
      closure: (schema) => {
        if (OpenApiTypeChecker.isObject(schema) === false) return;
        for (const key of Object.keys(schema.properties ?? {})) emplace(key);
      },
    });
  }
  return Array.from(result);
};
