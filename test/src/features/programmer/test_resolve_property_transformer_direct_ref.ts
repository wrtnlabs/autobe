import {
  IResolvedTransformer,
  resolvePropertyTransformer,
} from "@autobe/agent/src/orchestrate/realize/programmers/internal/resolvePropertyTransformer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockTransformer } from "./internal/createMockTransformer";

/** A direct $ref property should resolve to its transformer with isArray=false. */
export const test_resolve_property_transformer_direct_ref = (): void => {
  const transformer = createMockTransformer({
    dtoTypeName: "IArticle",
    databaseSchemaName: "articles",
  });

  const schema: AutoBeOpenApi.IJsonSchemaProperty = {
    $ref: "#/components/schemas/IArticle",
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
  TestValidator.equals("should not be array", result!.isArray, false);
};
