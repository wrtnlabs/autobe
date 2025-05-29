import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBePrismaCompilerResult } from "@autobe/interface";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformPrismaCompilerHistories = (
  files: Record<string, string>,
  result: IAutoBePrismaCompilerResult.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_COMPILER,
    },
    {
      type: "assistantMessage",
      text: [
        "Below are the current schema files that failed compilation:",
        "",
        "```json",
        JSON.stringify(files),
        "```",
      ].join("\n"),
    },
    {
      type: "assistantMessage",
      text: [
        `Here is the compiler error message. Please fix the schema files`,
        `referencing the error message.`,
        "",
        result.reason,
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
