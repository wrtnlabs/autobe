import { OpenApiTypeChecker } from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { IAutoBeInterfaceApplication } from "./IAutoBeInterfaceApplication";

export function validateInterfaceProps(
  props: unknown,
): IValidation<IAutoBeInterfaceApplication.IProps> {
  const result: IValidation<IAutoBeInterfaceApplication.IProps> =
    typia.validate<IAutoBeInterfaceApplication.IProps>(props);
  if (result.success === false) return result;

  const bodyReferences: Set<string> = new Set();
  for (const op of result.data.document.operations) {
    const predicate = ($ref: string) => {
      const key: string = $ref.split("/").at(-1)!;
      if (result.data.document.components.schemas?.[key] === undefined)
        bodyReferences.add(key);
    };
    if (op.body) predicate(op.body.schema.$ref);
    if (op.response) predicate(op.response.schema.$ref);
  }

  const bodyNotFounds: Set<string> = new Set();
  const bodyNotObjects: Set<string> = new Set();
  const referenceNotFounds: Set<string> = new Set();

  for (const key of bodyReferences)
    if (result.data.document.components.schemas?.[key] === undefined)
      bodyNotFounds.add(key);
    else if (
      OpenApiTypeChecker.isObject(
        result.data.document.components.schemas[key],
      ) === false
    )
      bodyNotObjects.add(key);

  for (const [key, value] of Object.entries(
    result.data.document.components.schemas ?? {},
  )) {
    OpenApiTypeChecker.visit({
      components: result.data.document.components,
      schema: value,
      closure: (schema) => {
        if (OpenApiTypeChecker.isReference(schema)) {
          const key: string = schema.$ref.split("/").at(-1)!;
          if (result.data.document.components.schemas?.[key] === undefined)
            bodyNotFounds.add(key);
        }
      },
    });
  }

  if (
    bodyNotFounds.size === 0 ||
    bodyNotObjects.size === 0 ||
    referenceNotFounds.size === 0
  )
    return result;
  return {
    success: false,
    data: result.data,
    errors: [
      ...[...bodyNotFounds, ...bodyNotObjects].map((key) => ({
        path: `document.components.schemas.${key}`,
        expected: "OpenApi.IJsonSchema.IObject",
        value: result.data.document.components.schemas?.[key],
      })),
      ...Array.from(referenceNotFounds).map((key) => ({
        path: `document.components.schemas.${key}`,
        expected: "OpenApi.IJsonSchema",
        value: undefined,
      })),
    ],
  };
}
