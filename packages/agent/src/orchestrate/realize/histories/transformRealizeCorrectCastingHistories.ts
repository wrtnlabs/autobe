import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTransformHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistories } from "../../common/histories/transformPreviousAndLatestCorrectHistories";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeCorrectCastingHistories = (props: {
  failures: IAutoBeRealizeFunctionFailure[];
}): IAutoBeTransformHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
      },
      ...transformPreviousAndLatestCorrectHistories(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: "Fix the type casting errors in the implementation please",
  };
};
