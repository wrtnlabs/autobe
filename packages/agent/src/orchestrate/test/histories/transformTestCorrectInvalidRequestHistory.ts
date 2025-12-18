import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestAgentResult } from "../structures/IAutoBeTestAgentResult";

export const transformTestCorrectInvalidRequestHistory = (
  write: IAutoBeTestAgentResult,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): IAutoBeOrchestrateHistory => {
  const systemPrompt: string = (() => {
    switch (write.function.type) {
      case "operation":
        return AutoBeSystemPromptConstant.TEST_OPERATION_CORRECT_INVALID_REQUEST;
      case "prepare":
        return AutoBeSystemPromptConstant.TEST_PREPARE_CORRECT_INVALID_REQUEST;
      case "generate":
        return AutoBeSystemPromptConstant.TEST_GENERATE_CORRECT_INVALID_REQUEST;
      case "authorize":
        return AutoBeSystemPromptConstant.TEST_AUTHORIZE_CORRECT_INVALID_REQUEST;
      default:
        write.function satisfies never;
        throw new Error(
          `Unreachable: Cannot create correct invalid request system prompt of function kind`,
        );
    }
  })();
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: systemPrompt,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## TypeScript Code

        \`\`\`typescript
        ${write.function.content}
        \`\`\`

        ## Compile Errors

        \`\`\`json
        ${JSON.stringify(diagnostics)}
        \`\`\`
      `,
      },
    ],
    userMessage: "Fix the compile errors in the test code please",
  };
};
