import { IAgenticaHistoryJson } from "@agentica/core";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export const transformPrismaComponentsHistories = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        type: "systemMessage",
        text: [
          "Requirement analysis is not yet completed.",
          "Don't call any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
  return [
    {
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_COMPONENT,
    },
    {
      type: "assistantMessage",
      text: [
        "Here is the requirement analysis report.",
        "",
        "Call the provided tool function to generate Prisma DB schema",
        "referencing below requirement analysis report.",
        "",
        "## User Request",
        state.analyze.reason,
        "",
        `## Requirement Analysis Report`,
        "",
        "```json",
        JSON.stringify(state.analyze.files),
        "```",
      ].join("\n"),
    },
  ];
};
