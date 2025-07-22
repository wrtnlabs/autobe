import { IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";

export function replaceImportStatements<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
) {
  return async function (code: string) {
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
      .replace(
        /import\s*{\s*jwtDecode\s*}\s*from\s*["']\.\/jwtDecode["']\s*;?\s*/gm,
        "",
      )
      .replace(/import\s*{\s*v4\s*}\s*from\s*["']uuid["']\s*;?\s*/gm, "")
      .replace('import { toISOStringSafe } from "./toISOStringSafe"', "");

    code = [
      'import { MyGlobal } from "../MyGlobal";',
      'import typia, { tags } from "typia";',
      'import { Prisma } from "@prisma/client";',
      'import { jwtDecode } from "./jwtDecode";',
      'import { v4 } from "uuid";',
      'import { toISOStringSafe } from "./toISOStringSafe"',
      "",
      code,
    ].join("\n");

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

    return code;
  };
}
