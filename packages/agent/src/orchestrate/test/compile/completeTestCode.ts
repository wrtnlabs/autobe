import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import ts from "typescript";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { getTestImportStatements } from "./getTestImportStatements";

const removeImportStatements = (code: string): string => {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.ES2015,
    true,
  );

  const importRanges: { start: number; end: number }[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      importRanges.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
      });
    }
  });

  let result = code;
  for (const range of importRanges.reverse()) {
    result = result.slice(0, range.start) + result.slice(range.end);
  }

  return result;
};

export const completeTestCode = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  artifacts: IAutoBeTestArtifacts,
  code: string,
  additionalImport?: string,
): Promise<string> => {
  const compiler = await ctx.compiler();
  code = await compiler.typescript.beautify(code);
  code = removeImportStatements(code);

  const imports = [
    getTestImportStatements(artifacts.document),
    additionalImport ? additionalImport : "",
  ]
    .filter((imp) => imp.trim().length > 0)
    .join("\n");

  return await compiler.typescript.beautify(StringUtil.trim`
    ${imports}
    
    ${code}
  `);
};
