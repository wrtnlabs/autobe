import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformPrismaReviewerHistories = (input: {
  /** The Prisma application structure being reviewed */
  application: AutoBePrisma.IApplication;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Below is the Prisma database schema that needs to be reviewed.",
        "```json",
        JSON.stringify(input.application, null, 2),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_REVIEWER,
    },
  ];
};