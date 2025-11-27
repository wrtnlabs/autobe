import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export namespace AutoBeRealizeOperationFactory {
  export function writeImportStatements(props: {
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
    if (props.operation.requestBody)
      visit(props.operation.requestBody.typeName);
    if (props.operation.responseBody)
      visit(props.operation.responseBody.typeName);

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

  export async function replaceImportStatements<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    props: {
      operation: AutoBeOpenApi.IOperation;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
      decoratorType?: string;
    },
  ): Promise<string> {
    let { code, decoratorType } = props;

    // Beautify code first for consistent formatting
    const compiler: IAutoBeCompiler = await ctx.compiler();
    code = await compiler.typescript.beautify(code);

    // Remove all LLM-generated imports
    code = code
      .split("\r\n")
      .join("\n")
      .split("\n")
      .filter((str) => str.trim().startsWith("import") === false)
      .join("\n");

    // Build the standard imports
    const imports = writeImportStatements(props);

    // Only add decoratorType import if it exists
    if (decoratorType) {
      imports.push(
        `import { ${decoratorType} } from "../decorators/payload/${decoratorType}"`,
      );
    }

    code = [...imports, "", code].join("\n");

    // Clean up formatting issues
    code =
      code
        // Remove lines with only whitespace
        .replace(/^\s+$/gm, "")
        // Replace 3+ consecutive newlines with exactly 2 newlines
        .replace(/\n{3,}/g, "\n\n")
        // Ensure proper spacing after import section
        .replace(/(import.*?;)(\s*)(\n(?!import|\s*$))/g, "$1\n\n$3")
        // Trim and ensure single trailing newline
        .trim() + "\n";

    // fix escaped codes
    code = code.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");

    // Apply final beautification
    code = await compiler.typescript.beautify(code);
    code = code.replaceAll("typia.tags.assert", "typia.assert");
    return code;
  }
}
