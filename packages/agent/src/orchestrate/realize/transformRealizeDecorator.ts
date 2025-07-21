import { IAgenticaHistoryJson } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";

export const transformRealizeDecoratorHistories = (
  ctx: AutoBeContext<ILlmSchema.Model>,
  role: string,
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
        "## Prisma Schema",
        "",
        JSON.stringify(ctx.state().prisma?.schemas, null, 2),
        "",
      ].join("\n"),
    },
  ];
};
