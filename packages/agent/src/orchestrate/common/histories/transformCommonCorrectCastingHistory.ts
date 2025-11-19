import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistory } from "./transformPreviousAndLatestCorrectHistory";

export const transformCommonCorrectCastingHistory = (
  failures: IFailure[],
): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
    },
    ...transformPreviousAndLatestCorrectHistory(failures),
  ],
  userMessage: StringUtil.trim`
    Fix the TypeScript casting problems to resolve the compilation error.

    You don't need to explain me anything, but just fix or give it up
    immediately without any hesitation, explanation, and questions.
  `,
});

interface IFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  script: string;
}
