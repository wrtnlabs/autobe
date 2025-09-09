import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";

export const transformTestCorrectInvalidRequestHistories = (
  func: IAutoBeTestFunction,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
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
        ${JSON.stringify(failure.diagnostics)}
        \`\`\`
      `,
    },
  ];
};
