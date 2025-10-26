import { IAgenticaHistoryJson } from "@agentica/core";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { transformPreviousAndLatestCorrectHistories } from "../../common/histories/transformPreviousAndLatestCorrectHistories";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeCorrectCastingHistories = (props: {
  failures: IAutoBeRealizeFunctionFailure[];
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const histories: Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  > = [
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
  ];
  return histories;
};
