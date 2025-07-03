import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeTestScenario } from "@autobe/interface";
import { IValidation } from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export const transformTestWriteHistories = (props: {
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  failure: IValidation.IFailure | null;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_WRITE,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here is the list of input material composition.",
        "",
        "Make e2e test functions based on the following information.",
        "",
        "## Scenario Plan",
        "```json",
        JSON.stringify(props.scenario),
        "```",
        "",
        "## OpenAPI Document",
        "```json",
        JSON.stringify(props.artifacts.document),
        "```",
        "",
      ].join("\n"),
    },
    ...(props.failure !== null
      ? [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "assistantMessage",
            text: [
              "You have written a test function by AI function calling,",
              "but the function calling generated argument could not pass",
              "the validation rule",
              "",
              "Here is the validation error information. Please fix the error",
              "when re-trying the AI functiopn calling.",
              "",
              "- `data`: Previous composed argument what you've written",
              "- `errors`: Validation error information",
              "",
              "```json",
              JSON.stringify(props.failure),
              "```",
            ].join("\n"),
          } satisfies IAgenticaHistoryJson.IAssistantMessage,
        ]
      : []),
  ];
};
