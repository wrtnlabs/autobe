import {
  IResolvedTransformer,
  resolvePropertyTransformer,
} from "@autobe/agent/src/orchestrate/realize/programmers/internal/resolvePropertyTransformer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockTransformer } from "./internal/createMockTransformer";

/**
 * A nullable $ref (oneOf [null, $ref]) should unwrap and resolve with
 * isArray=false.
 */
export const test_resolve_property_transformer_nullable_ref = (): void => {
  const transformer = createMockTransformer({
    dtoTypeName: "IUser",
    databaseSchemaName: "users",
  });

  const schema: AutoBeOpenApi.IJsonSchemaProperty = {
    oneOf: [{ type: "null" }, { $ref: "#/components/schemas/IUser" }],
  } as AutoBeOpenApi.IJsonSchemaProperty;

  const result: IResolvedTransformer | null = resolvePropertyTransformer({
    schema,
    transformers: [transformer],
  });

  TestValidator.equals("should not be null", result !== null, true);
  TestValidator.equals(
    "should match user transformer",
    result!.transformer,
    transformer,
  );
  TestValidator.equals("should not be array", result!.isArray, false);
};
