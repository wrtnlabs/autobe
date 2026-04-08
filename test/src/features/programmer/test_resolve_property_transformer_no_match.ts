import { resolvePropertyTransformer } from "@autobe/agent/src/orchestrate/realize/programmers/internal/resolvePropertyTransformer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockTransformer } from "./internal/createMockTransformer";

/** A primitive property (string) should return null — no transformer match. */
export const test_resolve_property_transformer_no_match = (): void => {
  const schema: AutoBeOpenApi.IJsonSchemaProperty = {
    type: "string",
  } as AutoBeOpenApi.IJsonSchemaProperty;

  const result = resolvePropertyTransformer({
    schema,
    transformers: [
      createMockTransformer({
        dtoTypeName: "IArticle",
        databaseSchemaName: "articles",
      }),
    ],
  });

  TestValidator.equals("should be null for primitive", result, null);
};
