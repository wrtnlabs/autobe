import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestScenarioApplication } from "../structures/IAutoBeTestScenarioApplication";

export function transformTestScenarioReviewHistories<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> {
  const operations: AutoBeOpenApi.IOperation[] =
    ctx.state().interface?.document.operations ?? [];

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO_REVIEW,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        # Available API Operations for Reference

        Below are all available API operations for validation purposes:

        \`\`\`json
        ${JSON.stringify(
          operations.map((op) => ({
            method: op.method,
            path: op.path,
            authorizationRole: op.authorizationRole,
            summary: op.summary,
          })),
        )}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Please review the following test scenario groups:

        \`\`\`json
        ${JSON.stringify(groups)}
        \`\`\`
      `,
    },
  ];
}
