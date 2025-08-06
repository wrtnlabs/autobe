import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformPrismaReviewHistories = (
  application: AutoBePrisma.IApplication,
  schemas: Record<string, string>,
  component: AutoBePrisma.IComponent,
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
        "Here is the complete AST definition for the database schema:",
        "",
        "```json",
        JSON.stringify(application, null, 2),
        "```",
        "",
        "And here are the Prisma schema files generated from the above AST:",
        "",
        "```prisma",
        JSON.stringify(schemas),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_REVIEW,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        `Now, please review the tables in the "${component.namespace}" namespace.`,
        "",
        "Focus your review exclusively on these tables.",
        "",
        "**Tables in this namespace:**",
        ...component.tables.map((table) => `- ${table}`),
      ].join("\n"),
    },
  ];
};
