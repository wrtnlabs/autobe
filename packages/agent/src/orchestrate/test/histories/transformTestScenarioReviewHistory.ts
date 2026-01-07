import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { getPrerequisites } from "../utils/getPrerequisites";

/**
 * Transform test scenario review context into conversational history.
 *
 * Creates the complete conversation history for reviewing a single test scenario,
 * including system prompts, user instructions, and the scenario to be reviewed.
 *
 * @param props - Configuration for history transformation
 * @param props.state - Current AutoBe state containing interface document
 * @param props.instruction - E2E-test-specific instructions from user requirements
 * @param props.scenario - Single test scenario to review and potentially improve
 * @param props.preliminary - Controller for RAG-based preliminary data requests
 * @returns Complete conversation history ready for LLM agent processing
 */
export function transformTestScenarioReviewHistory(props: {
  state: AutoBeState;
  instruction: string;
  scenario: AutoBeTestScenario;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
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
      ...props.preliminary.getHistories(),
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

          ## Test Scenario to Review

          The following test scenario needs to be reviewed for quality and correctness.
          Prerequisites are provided for reference to validate dependency completeness.

          \`\`\`json
          ${JSON.stringify({
            scenario: props.scenario,
            prerequisites: getPrerequisites({
              document,
              endpoint: props.scenario.endpoint,
            }),
          })}
          \`\`\`
        `,
      },
    ],
    userMessage: "Review the test scenarios please",
  };
}
