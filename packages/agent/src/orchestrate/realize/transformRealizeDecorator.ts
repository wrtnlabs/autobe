import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformRealizeDecoratorHistories = (
  role: string,
  prismaClients: Record<string, string>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_DECORATOR,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "Create Authorization Provider.",
        "The role is " + role,
        "The Prisma Clients are " + Object.keys(prismaClients).join(", "),
      ].join("\n"),
    },
  ];
};
