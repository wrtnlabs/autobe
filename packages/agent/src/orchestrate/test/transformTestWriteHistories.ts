import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeTestScenario } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export const transformTestWriteHistories = (props: {
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
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
        "## Secnario Plan",
        "```json",
        JSON.stringify(props.scenario),
        "```",
        "",
        "## DTO Definitions",
        "```json",
        JSON.stringify(props.artifacts.dto),
        "```",
        "",
        "## API (SDK) Functions",
        "```json",
        JSON.stringify(props.artifacts.sdk),
        "```",
        "",
        "## E2E Mockup Functions",
        "```json",
        JSON.stringify(props.artifacts.e2e),
        "```",
        "",
      ].join("\n"),
    },
  ];
};
