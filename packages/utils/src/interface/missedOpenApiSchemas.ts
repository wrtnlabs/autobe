import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";

export const missedOpenApiSchemas = (
  document: AutoBeOpenApi.IDocument,
): string[] => {
  const missed: Set<string> = new Set();
  const check = (name: string) => {
    if (document.components.schemas[name] === undefined) missed.add(name);
  };
  for (const op of document.operations) {
    if (op.requestBody !== null) check(op.requestBody.typeName);
    if (op.responseBody !== null) check(op.responseBody.typeName);
  }
  for (const value of Object.values(document.components.schemas))
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: value,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          check(next.$ref.split("/").pop()!);
      },
    });
  return Array.from(missed);
};
