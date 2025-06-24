import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeTestScenarioEvent } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformTestProgressHistories = (props: {
  scenario: AutoBeTestScenarioEvent.IScenario;
  dto: Record<string, string>;
  sdk: Record<string, string>;
  e2e: Record<string, string>;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_PROGRESS,
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
        "## Secnario Plan",
        "```json",
        JSON.stringify(props.scenario),
        "```",
        "",
        "## DTO Definitions",
        "```json",
        JSON.stringify(props.dto),
        "```",
        "",
        "## API (SDK) Functions",
        "```json",
        JSON.stringify(props.sdk),
        "```",
        "",
        "## E2E Mockup Functions",
        "```json",
        JSON.stringify(props.e2e),
        "```",
        "",
      ].join("\n"),
    },
  ];
};
