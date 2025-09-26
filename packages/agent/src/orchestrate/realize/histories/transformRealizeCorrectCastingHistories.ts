import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

interface IFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  script: string;
}

export const transformRealizeCorrectCastingHistories = (
  failures: IFailure[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT_CASTING,
    },
    ...failures.map(
      (f, i, array) =>
        ({
          id: v7(),
          created_at: new Date().toISOString(),
          type: "assistantMessage",
          text: StringUtil.trim`
          # ${i === array.length - 1 ? "Latest Failure" : "Previous Failure"}
          ## Generated TypeScript Code
          \`\`\`typescript
          ${f.script}
          \`\`\`
          ## Compile Errors
          \`\`\`json
          ${JSON.stringify(f.diagnostics)}
          \`\`\`
        `,
        }) satisfies IAgenticaHistoryJson.IAssistantMessage,
    ),
  ];
};
