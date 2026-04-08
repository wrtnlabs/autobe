import {
  IResolvedTransformer,
  resolvePropertyTransformer,
} from "@autobe/agent/src/orchestrate/realize/programmers/internal/resolvePropertyTransformer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockTransformer } from "./internal/createMockTransformer";

/**
 * A nullable array (oneOf [null, array { items: $ref }]) should unwrap and
 * resolve with isArray=true.
 */
export const test_resolve_property_transformer_nullable_array = (): void => {
  const transformer = createMockTransformer({
    dtoTypeName: "IArticle",
    databaseSchemaName: "articles",
  });

  const schema: AutoBeOpenApi.IJsonSchemaProperty = {
    oneOf: [
      { type: "null" },
      {
        type: "array",
        items: { $ref: "#/components/schemas/IArticle" },
      },
    ],
  } as AutoBeOpenApi.IJsonSchemaProperty;

  const result: IResolvedTransformer | null = resolvePropertyTransformer({
    schema,
    transformers: [transformer],
  });

  TestValidator.equals("should not be null", result !== null, true);
  TestValidator.equals(
    "should match article transformer",
    result!.transformer,
    transformer,
  );
  TestValidator.equals("should be array", result!.isArray, true);
};
