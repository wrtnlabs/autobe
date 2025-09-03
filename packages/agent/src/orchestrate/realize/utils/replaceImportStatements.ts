import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { getRealizeWriteImportStatements } from "./getRealizeWriteImportStatements";

export async function replaceImportStatements<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    code: string;
    decoratorType?: string;
  },
) {
  let { operation, code, decoratorType } = props;

  const typeReferences: string[] = Array.from(
    new Set(
      [operation.requestBody, operation.responseBody]
        .filter((el) => el !== null)
        .map((el) => el.typeName.split(".")[0]!),
    ),
  );

  const compiler: IAutoBeCompiler = await ctx.compiler();
  code = await compiler.typescript.beautify(code);
  // Remove existing import statements using flexible regex patterns
  code = code
    .replace(
      /import\s*{\s*MyGlobal\s*}\s*from\s*["']\.\.\/MyGlobal["']\s*;?\s*/gm,
      "",
    )
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
    .replace(
      /import\s*{\s*Prisma\s*}\s*from\s*["']@prisma\/client["']\s*;?\s*/gm,
      "",
    )
    .replace(/import\s*{\s*v4\s*}\s*from\s*["']uuid["']\s*;?\s*/gm, "")
    .replace(
      /import\s*{\s*toISOStringSafe\s*}\s*from\s*["']\.\.\/util\/toISOStringSafe["']\s*;?\s*/gm,
      "",
    )
    // Remove JWT import if it exists (to prevent duplication)
    .replace(/import\s+jwt\s+from\s*["']jsonwebtoken["']\s*;?\s*/gm, "")
    .replace(
      /import\s*\*\s*as\s+jwt\s+from\s*["']jsonwebtoken["']\s*;?\s*/gm,
      "",
    );

  // Remove any existing API structure imports
  // Pattern 1: ../api/structures path
  code = code.replace(
    /import\s*(?:type\s*)?{\s*[^}]+\s*}\s*from\s*["']\.\.\/api\/structures\/[^"']+["']\s*;?\s*/gm,
    "",
  );
  // Pattern 2: @ORGANIZATION/PROJECT-api/lib/structures path
  code = code.replace(
    /import\s*(?:type\s*)?{\s*[^}]+\s*}\s*from\s*["']@ORGANIZATION\/PROJECT-api\/lib\/structures\/[^"']+["']\s*;?\s*/gm,
    "",
  );

  // Remove specific type imports that match our typeReferences
  for (const ref of typeReferences) {
    // Remove any import of this specific type from any path
    const typeImportRegex = new RegExp(
      `import\\s*(?:type\\s*)?{\\s*${ref}\\s*}\\s*from\\s*["'][^"']+["']\\s*;?\\s*`,
      "gm",
    );
    code = code.replace(typeImportRegex, "");
  }

  // Remove any existing decoratorType imports if LLM mistakenly added them
  if (decoratorType) {
    const decoratorTypeRegex = new RegExp(
      `import\\s*(?:type\\s*)?{\\s*${decoratorType}\\s*}\\s*from\\s*["']\\.\\.\/decorators\/payload\/${decoratorType}["']\\s*;?\\s*`,
      "gm",
    );
    code = code.replace(decoratorTypeRegex, "");
  }

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
