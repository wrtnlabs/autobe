import { AutoBeRealizeAuthorization } from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTransformHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistories } from "../../common/histories/transformPreviousAndLatestCorrectHistories";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { transformRealizeWriteHistories } from "./transformRealizeWriteHistories";

export function transformRealizeCorrectHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
  failures: IAutoBeRealizeFunctionFailure[];
}): IAutoBeTransformHistory {
  const writeHistories = transformRealizeWriteHistories(props);
  return {
    histories: [
      ...writeHistories.histories,
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
      },
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
        created_at: new Date().toISOString(),
      },
      ...transformPreviousAndLatestCorrectHistories(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: "Fix the compile errors in the implementation please",
  };
}
