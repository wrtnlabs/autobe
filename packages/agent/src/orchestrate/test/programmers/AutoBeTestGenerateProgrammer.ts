import { AutoBeOpenApi } from "@autobe/interface";

import { AutoBeTestPrepareProgrammer } from "./AutoBeTestPrepareProgrammer";

export namespace AutoBeTestGenerateProgrammer {
  export function is(
    document: AutoBeOpenApi.IDocument,
    operation: AutoBeOpenApi.IOperation,
  ): boolean {
    if (operation.requestBody === null) return false;
    const schema: AutoBeOpenApi.IJsonSchema | undefined =
      document.components.schemas[operation.requestBody.typeName];
    if (schema === undefined) return false;
    return AutoBeTestPrepareProgrammer.is(
      operation.requestBody.typeName,
      schema,
    );
  }

  export function size(document: AutoBeOpenApi.IDocument): number {
    return document.operations.filter((operation) =>
      AutoBeTestGenerateProgrammer.is(document, operation),
    ).length;
  }
}
