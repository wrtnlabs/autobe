import {
  IResolvedTransformer,
  resolvePropertyTransformer,
} from "@autobe/agent/src/orchestrate/realize/programmers/internal/resolvePropertyTransformer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockTransformer } from "./internal/createMockTransformer";

/** An array property whose items are a $ref should resolve with isArray=true. */
export const test_resolve_property_transformer_array_ref = (): void => {
  const transformer = createMockTransformer({
    dtoTypeName: "IArticle",
    databaseSchemaName: "articles",
  });

  const schema: AutoBeOpenApi.IJsonSchemaProperty = {
    type: "array",
    items: { $ref: "#/components/schemas/IArticle" },
  } as AutoBeOpenApi.IJsonSchemaProperty;

  const result: IResolvedTransformer | null = resolvePropertyTransformer({
    schema,
    transformers: [transformer],
  });

  TestValidator.equals("should not be null", result !== null, true);
  TestValidator.equals(
    "should match transformer",
    result!.transformer,
    transformer,
  );
  TestValidator.equals("should be array", result!.isArray, true);
};
