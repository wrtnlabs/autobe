import { IAgenticaHistoryJson } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { transformPreviousAndLatestCorrectHistories } from "../../common/histories/transformPreviousAndLatestCorrectHistories";
import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";
import { IAutoBeTestFunctionFailure } from "../structures/IAutoBeTestFunctionFailure";
import { transformTestWriteHistories } from "./transformTestWriteHistories";

export const transformTestCorrectHistories = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    function: IAutoBeTestFunction;
    failures: IAutoBeTestFunctionFailure[];
  },
): Promise<
  Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  >
> => {
  const previous: Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  > = await transformTestWriteHistories(ctx, {
    instruction: props.instruction,
    scenario: props.function.scenario,
    artifacts: props.function.artifacts,
  });
  return [
    ...previous.slice(0, -1),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT,
    },
    previous.at(-1)!,
    ...transformPreviousAndLatestCorrectHistories(
      props.failures.map((f) => ({
        script: f.function.script,
        diagnostics: f.failure.diagnostics,
      })),
    ),
  ];
};
