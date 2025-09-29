import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { printErrorHints } from "../utils/printErrorHints";

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
      (f) =>
        ({
          id: v7(),
          created_at: new Date().toISOString(),
          type: "assistantMessage",
          text: StringUtil.trim`
          # Errors

          This is a past code and an error with the code. Please refer to the annotation for the location of the error.

          ${printErrorHints(f.script, f.diagnostics)}          
          \`\`\`
        `,
        }) satisfies IAgenticaHistoryJson.IAssistantMessage,
    ),
  ];
};
