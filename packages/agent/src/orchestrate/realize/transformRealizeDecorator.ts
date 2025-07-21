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
        "## Role",
        "",
        role,
        "",
        "## Prisma Clients",
        "",
        JSON.stringify(prismaClients, null, 2),
        "",
      ].join("\n"),
    },
  ];
};
