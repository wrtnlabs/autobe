import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestScenarioApplication } from "../structures/IAutoBeTestScenarioApplication";
import { getPrerequisites } from "../utils/getPrerequisites";

export function transformTestScenarioReviewHistories(props: {
  state: AutoBeState;
  instruction: string;
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[];
}): IAutoBeOrchestrateHistory {
  const document: AutoBeOpenApi.IDocument | undefined =
    props.state.interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot review test scenarios because there are no operations.",
    );
  }

  return {
    histories: [
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

          The following e2e-test-specific instructions were extracted from
          the user's requirements and conversations. These instructions focus
          exclusively on test-related aspects such as test coverage priorities,
          specific edge cases to validate, business logic verification strategies,
          and critical user workflows that must be tested.

          Follow these instructions when reviewing test scenarios.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

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
    ],
    userMessage: "Review the test scenarios please",
  };
}
