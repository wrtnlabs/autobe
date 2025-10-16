import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioApplication } from "../structures/IAutoBeTestScenarioApplication";
import { getPrerequisites } from "../utils/getPrerequisites";

export function transformTestScenarioReviewHistories(props: {
  state: AutoBeState;
  instruction: string;
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[];
}): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> {
  const document: AutoBeOpenApi.IDocument | undefined =
    props.state.interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot review test scenarios because there are no operations.",
    );
  }

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
        ## Instructions

        The following e2e-test-specific instructions were extracted by AI from
        the user's requirements and conversations. These instructions focus
        exclusively on test-related aspects such as test coverage priorities,
        specific edge cases to validate, business logic verification strategies,
        and critical user workflows that must be tested.
        
        Apply these instructions when reviewing test scenarios to ensure the
        tests align with the user's testing requirements and expectations.
        If any instructions are relevant to the target API operations,
        you MUST follow them exactly without arbitrary judgment.
        DO NOT make your own decisions even if you think you have better ideas.
        Only ignore instructions that are completely unrelated to the target
        API operations.

        ${props.instruction}

        ## Available API Operations for Reference

        Below are all available API operations and interface schemas for validation purposes.
        Match each operation with its corresponding schema.

        \`\`\`json
        ${JSON.stringify({ operations: document.operations })}
        \`\`\`

        ## Test Scenario Groups to Review

        Each scenario group includes the target endpoint and its prerequisite endpoints.

        \`\`\`json
        ${JSON.stringify(
          props.groups.map((g) => ({
            ...g,
            prerequisites: getPrerequisites({
              document,
              endpoint: g.endpoint,
            }),
          })),
        )}
        \`\`\`
      `,
    },
  ];
}
