import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { getRealizeWriteImportStatements } from "./getRealizeWriteImportStatements";

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
  const imports = getRealizeWriteImportStatements(props);

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
