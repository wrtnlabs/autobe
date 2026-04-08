import {
  AutoBeOpenApi,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";

export interface IResolvedTransformer {
  transformer: AutoBeRealizeTransformerFunction;
  isArray: boolean;
}

/**
 * Resolves a JSON schema property to its matching Transformer.
 *
 * Handles direct `$ref`, `array` of `$ref`, and `oneOf` (nullable) wrappers by
 * recursively unwrapping until a Transformer match is found.
 */
export function resolvePropertyTransformer(props: {
  schema: AutoBeOpenApi.IJsonSchemaProperty;
  transformers: AutoBeRealizeTransformerFunction[];
}): IResolvedTransformer | null {
  // direct reference → single transform
  if (AutoBeOpenApiTypeChecker.isReference(props.schema)) {
    const typeName: string = props.schema.$ref.split("/").pop()!;
    const transformer: AutoBeRealizeTransformerFunction | undefined =
      props.transformers.find(
        (t: AutoBeRealizeTransformerFunction): boolean =>
          t.plan.dtoTypeName === typeName,
      );
    if (transformer) return { transformer, isArray: false };
  }

  // array of references → asyncMap transform
  if (AutoBeOpenApiTypeChecker.isArray(props.schema)) {
    const items: Exclude<
      AutoBeOpenApi.IJsonSchema,
      AutoBeOpenApi.IJsonSchema.IObject
    > = props.schema.items;
    if (AutoBeOpenApiTypeChecker.isReference(items)) {
      const typeName: string = items.$ref.split("/").pop()!;
      const transformer: AutoBeRealizeTransformerFunction | undefined =
        props.transformers.find(
          (t: AutoBeRealizeTransformerFunction): boolean =>
            t.plan.dtoTypeName === typeName,
        );
      if (transformer) return { transformer, isArray: true };
    }
  }

  // oneOf (nullable reference) → unwrap non-null variant
  if (AutoBeOpenApiTypeChecker.isOneOf(props.schema)) {
    for (const variant of props.schema.oneOf) {
      if (AutoBeOpenApiTypeChecker.isNull(variant)) continue;
      const result: IResolvedTransformer | null = resolvePropertyTransformer({
        schema: variant as AutoBeOpenApi.IJsonSchemaProperty,
        transformers: props.transformers,
      });
      if (result) return result;
    }
  }

  return null;
}
