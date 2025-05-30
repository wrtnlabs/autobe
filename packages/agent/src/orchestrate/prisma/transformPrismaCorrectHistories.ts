import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBePrismaValidation } from "@autobe/interface";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformPrismaCorrectHistories = (
  result: IAutoBePrismaValidation.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_CORRECT,
    },
    {
      type: "assistantMessage",
      text: [
        "Here is the Prisma application data what you made:",
        "",
        "```json",
        JSON.stringify(result.data),
        "```",
      ].join("\n"),
    },
    {
      type: "assistantMessage",
      text: [
        "Below are the list of errors what you have to fix:",
        "",
        "```json",
        JSON.stringify(result.errors),
        "```",
      ].join("\n"),
    },
    {
      type: "systemMessage",
      text: [
        "Before fixing the schema files,",
        "study about Prisma schema language",
        "from the best practices and examples",
        "",
        AutoBeSystemPromptConstant.PRISMA_EXAMPLE,
      ].join("\n"),
    },
  ];
};
