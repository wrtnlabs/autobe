import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";

export const getReferenceIds = (props: {
  document: AutoBeOpenApi.IDocument;
  operation: AutoBeOpenApi.IOperation;
}): string[] => {
  const result: Set<string> = new Set();
  const emplace = (key: string) => {
    if (key.endsWith("_id")) result.add(key);
  };

  props.operation.parameters.forEach((p) => emplace(p.name));
  if (props.operation.requestBody) {
    OpenApiTypeChecker.visit({
      components: props.document.components,
      schema: { $ref: props.operation.requestBody.typeName },
      closure: (schema) => {
        if (OpenApiTypeChecker.isObject(schema) === false) return;
        for (const key of Object.keys(schema.properties ?? {})) emplace(key);
      },
    });
  }
  return Array.from(result);
};
