import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { getTestImportStatements } from "./getTestImportStatements";

export const getTestTemplateCode = (
  scenario: Pick<
    AutoBeTestScenario,
    "endpoint" | "dependencies" | "functionName"
  >,
  document: AutoBeOpenApi.IDocument,
): string => {
  return StringUtil.trim`
    ${getTestImportStatements(document)}

    /**
     * <SCENARIO DESCRIPTION HERE>
     */
    export async function ${scenario.functionName}(
      connection: api.IConnection,
    ) {
      // <E2E TEST CODE HERE>
    }
  `;
};
