import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";
import { getTestImportStatements } from "./getTestImportStatements";

export const completeTestCode = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  artifacts: IAutoBeTestScenarioArtifacts,
  code: string,
  additionalImport?: string,
): Promise<string> => {
  const compiler = await ctx.compiler();
  code = await compiler.typescript.beautify(code);
  code = code
    .split("\r\n")
    .join("\n")
    .split("\n")
    .filter((str) => str.trim().startsWith("import") === false)
    .join("\n");

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
