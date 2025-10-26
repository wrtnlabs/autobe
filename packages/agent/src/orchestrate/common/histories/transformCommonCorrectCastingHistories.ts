import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { transformPreviousAndLatestCorrectHistories } from "./transformPreviousAndLatestCorrectHistories";

interface IFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  script: string;
}

export const transformCommonCorrectCastingHistories = (
  failures: IFailure[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
  },
  ...transformPreviousAndLatestCorrectHistories(failures),
];
