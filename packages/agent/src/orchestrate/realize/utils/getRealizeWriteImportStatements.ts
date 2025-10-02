import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApiTypeChecker } from "@samchon/openapi";

export function getRealizeWriteImportStatements(props: {
  operation: AutoBeOpenApi.IOperation;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): string[] {
  const typeReferences: Set<string> = new Set();
  const visit = (key: string) =>
    OpenApiTypeChecker.visit({
      schema: {
        $ref: `#/components/schemas/${key}`,
      },
      components: { schemas: props.schemas },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          typeReferences.add(next.$ref.split("/").pop()!.split(".")[0]!);
      },
    });
  if (props.operation.requestBody) visit(props.operation.requestBody.typeName);
  if (props.operation.responseBody)
    visit(props.operation.responseBody.typeName);

  // Build the standard imports
  const imports = [
    'import { HttpException } from "@nestjs/common";',
    'import { Prisma } from "@prisma/client";',
    'import jwt from "jsonwebtoken";',
    'import typia, { tags } from "typia";',
    'import { v4 } from "uuid";',

    'import { MyGlobal } from "../MyGlobal";',
    'import { PasswordUtil } from "../utils/PasswordUtil";',
    'import { toISOStringSafe } from "../utils/toISOStringSafe"',
    "",
    ...Array.from(typeReferences).map(
      (ref) =>
        `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
  ];
  return imports;
}
