import { IAgenticaHistoryJson } from "@agentica/core";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export const transformPrismaSchemaHistories = (
  state: AutoBeState,
  draft?: string,
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

  if (draft) {
    return [
      {
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.PRISMA_SCHEMA_DRAFT,
      },
      {
        type: "assistantMessage",
        text: AutoBeSystemPromptConstant.PRISMA_EXAMPLE,
      },
      {
        type: "systemMessage",
        text: [
          "Here is the Prisma database design document.",
          "",
          "Call the provided tool function to generate Prisma DB schema",
          "referencing below Prisma database design document.",
          "",
          `## Prisma Database Design Document`,
          "",
          draft,
          "",
        ].join("\n"),
      },
    ];
  }

  return [
    {
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_SCHEMA,
    },
    {
      type: "assistantMessage",
      text: AutoBeSystemPromptConstant.PRISMA_EXAMPLE,
    },
    {
      type: "systemMessage",
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
