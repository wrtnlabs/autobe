import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBePrismaValidation } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformPrismaCorrectHistories = (
  result: IAutoBePrismaValidation.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_CORRECT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Here is the Prisma application data what you made:
        
        \`\`\`json
        ${JSON.stringify(result.data)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Below are the list of errors what you have to fix:
        
        \`\`\`json
        ${JSON.stringify(result.errors)}
        \`\`\`
      `,
    },
  ];
};
