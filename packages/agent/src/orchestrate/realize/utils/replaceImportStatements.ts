import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { getRealizeWriteImportStatements } from "./getRealizeWriteImportStatements";

/**
 * Removes all import statements that LLM might have incorrectly added. This
 * includes standard library imports, auto-injected imports, and any API
 * structure imports with wrong paths.
 *
 * @param code - The code containing imports to remove
 * @param typeReferences - List of type names to specifically remove
 * @param decoratorType - Optional decorator type to remove
 * @returns Code with all imports removed
 */
function removeAllImports(
  code: string,
  typeReferences: string[],
  decoratorType?: string,
): string {
  // Remove standard library and auto-injected imports
  let cleanedCode = code
    // MyGlobal - often with wrong path
    .replace(
      /import\s*{\s*MyGlobal\s*}\s*from\s*["']\.\.\/MyGlobal["']\s*;?\s*/gm,
      "",
    )
    // typia - various import patterns
    .replace(
      /import\s+typia\s*,\s*{\s*tags\s*}\s*from\s*["']typia["']\s*;?\s*/gm,
      "",
    )
    .replace(/import\s*{\s*tags\s*}\s*from\s*["']typia["']\s*;?\s*/gm, "")
    .replace(
      /import\s*{\s*tags\s*,\s*typia\s*}\s*from\s*["']typia["']\s*;?\s*/gm,
      "",
    )
    .replace(/import\s+typia\s*from\s*["']typia["']\s*;?\s*/gm, "")
    // Prisma client
    .replace(
      /import\s*{\s*Prisma\s*}\s*from\s*["']@prisma\/client["']\s*;?\s*/gm,
      "",
    )
    // uuid
    .replace(/import\s*{\s*v4\s*}\s*from\s*["']uuid["']\s*;?\s*/gm, "")
    // toISOStringSafe utility
    .replace(
      /import\s*{\s*toISOStringSafe\s*}\s*from\s*["']\.\.\/util\/toISOStringSafe["']\s*;?\s*/gm,
      "",
    )
    // JWT imports (if LLM adds them)
    .replace(/import\s+jwt\s+from\s*["']jsonwebtoken["']\s*;?\s*/gm, "")
    .replace(
      /import\s*\*\s*as\s+jwt\s+from\s*["']jsonwebtoken["']\s*;?\s*/gm,
      "",
    )
    // NestJS HttpException
    .replace(
      /import\s*{\s*HttpException\s*}\s*from\s*["']@nestjs\/common["']\s*;?\s*/gm,
      "",
    );

  // Remove API structure imports with wrong paths
  // Pattern 1: ../api/structures path (LLM often uses this wrong path)
  cleanedCode = cleanedCode.replace(
    /import\s*(?:type\s*)?{\s*[^}]+\s*}\s*from\s*["']\.\.\/api\/structures\/[^"']+["']\s*;?\s*/gm,
    "",
  );
  // Pattern 2: @ORGANIZATION/PROJECT-api path (correct path but LLM shouldn't write it)
  cleanedCode = cleanedCode.replace(
    /import\s*(?:type\s*)?{\s*[^}]+\s*}\s*from\s*["']@ORGANIZATION\/PROJECT-api\/lib\/structures\/[^"']+["']\s*;?\s*/gm,
    "",
  );

  // Remove specific type imports that match our typeReferences
  for (const ref of typeReferences) {
    const typeImportRegex = new RegExp(
      `import\\s*(?:type\\s*)?{\\s*${ref}\\s*}\\s*from\\s*["'][^"']+["']\\s*;?\\s*`,
      "gm",
    );
    cleanedCode = cleanedCode.replace(typeImportRegex, "");
  }

  // Remove decorator type imports if LLM mistakenly added them
  if (decoratorType) {
    const decoratorTypeRegex = new RegExp(
      `import\\s*(?:type\\s*)?{\\s*${decoratorType}\\s*}\\s*from\\s*["']\\.\\.\/decorators\/payload\/${decoratorType}["']\\s*;?\\s*`,
      "gm",
    );
    cleanedCode = cleanedCode.replace(decoratorTypeRegex, "");
  }

  return cleanedCode;
}

export async function replaceImportStatements<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    code: string;
    decoratorType?: string;
  },
) {
  let { operation, code, decoratorType } = props;

  // Extract type references from operation
  const typeReferences: string[] = Array.from(
    new Set(
      [operation.requestBody, operation.responseBody]
        .filter((el) => el !== null)
        .map((el) => el.typeName.split(".")[0]!),
    ),
  );

  // Beautify code first for consistent formatting
  const compiler: IAutoBeCompiler = await ctx.compiler();
  code = await compiler.typescript.beautify(code);

  // Remove all LLM-generated imports
  code = removeAllImports(code, typeReferences, decoratorType);

  // Build the standard imports
  const imports = getRealizeWriteImportStatements(operation);

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
