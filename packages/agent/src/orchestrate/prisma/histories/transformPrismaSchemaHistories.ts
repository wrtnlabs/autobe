import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformPrismaSchemaHistories = (
  requirementAnalysisReport: Record<string, string>,
  targetComponent: AutoBePrisma.IComponent,
  otherTables: string[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_SCHEMA,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here is the input data for generating Prisma DB schema.",
        "",
        "```",
        JSON.stringify({
          requirementAnalysisReport,
          targetComponent,
          otherTables,
        }),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "You've already taken a mistake that creating models from the other components.",
        "Note that, you have to make models from the target component only. Never make",
        "models from the other components. The other components' models are already made.",
        "",
        "```json",
        JSON.stringify({
          targetComponent,
        }),
        "```",
      ].join("\n"),
    },
  ];
};
