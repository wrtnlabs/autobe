import { AutoBeOpenApi } from "@autobe/interface";

export function getRealizeWriteImportStatements(
  operation: AutoBeOpenApi.IOperation,
) {
  const typeReferences: string[] = Array.from(
    new Set(
      [operation.requestBody, operation.responseBody]
        .filter((el) => el !== null)
        .map((el) => el.typeName.split(".")[0]!),
    ),
  );

  // Build the standard imports
  const imports = [
    'import jwt from "jsonwebtoken";',
    'import { MyGlobal } from "../MyGlobal";',
    'import typia, { tags } from "typia";',
    'import { Prisma } from "@prisma/client";',
    'import { v4 } from "uuid";',
    'import { toISOStringSafe } from "../util/toISOStringSafe"',
    ...typeReferences.map(
      (ref) =>
        `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
  ];

  return imports;
}
