import { StringUtil } from "@autobe/utils";

import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";
import { getTestImportStatements } from "./getTestImportStatements";

export function completeTestCode(
  artifacts: IAutoBeTestScenarioArtifacts,
  code: string,
): string {
  code = code
    .split("\r\n")
    .join("\n")
    .split("\n")
    .filter((str) => str.trim().startsWith("import") === false)
    .join("\n");

  // code = code.replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "").trim();
  // code = code.replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "").trim();
  // code = code.replaceAll(
  //   'string & Format<"uuid">',
  //   'string & tags.Format<"uuid">',
  // );
  return StringUtil.trim`
    ${getTestImportStatements(artifacts.document)}
    
    ${code}
  `;
}
