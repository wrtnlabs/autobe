import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";

export const transformTestCorrectInvalidRequestHistory = (
  func: IAutoBeTestFunction,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT_INVALID_REQUEST,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## TypeScript Code

        \`\`\`typescript
        ${func.script}
        \`\`\`

        ## Compile Errors

        \`\`\`json
        ${JSON.stringify(diagnostics)}
        \`\`\`
      `,
    },
  ],
  userMessage: "Fix the compile errors in the test code please",
});
