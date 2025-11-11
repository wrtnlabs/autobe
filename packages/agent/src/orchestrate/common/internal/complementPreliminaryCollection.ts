import { OpenApiTypeChecker } from "@samchon/openapi";

import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export const complementPreliminaryCollection = (props: {
  all: IAutoBePreliminaryCollection;
  local: IAutoBePreliminaryCollection;
}): void => {
  if (props.local.interfaceSchemas === undefined) return;
  else if (
    (props.local.interfaceOperations?.length ?? 0) === 0 &&
    Object.keys(props.local.interfaceSchemas).length === 0
  )
    return;

  const unique: Set<string> = new Set(
    Object.keys(props.local.interfaceSchemas),
  );
  for (const op of props.local.interfaceOperations ?? []) {
    if (op.requestBody) unique.add(op.requestBody.typeName);
    if (op.responseBody) unique.add(op.responseBody.typeName);
  }

  for (const key of unique)
    OpenApiTypeChecker.visit({
      components: {
        schemas: props.all.interfaceSchemas,
      },
      schema: {
        $ref: `#/components/schemas/${key}`,
      },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next)) {
          const last: string = next.$ref.split("/").pop()!;
          unique.add(last);
        }
      },
    });
  Object.assign(
    props.local.interfaceSchemas,
    Object.fromEntries(
      Array.from(unique).map((key) => [key, props.all.interfaceSchemas[key]]),
    ),
  );
};
