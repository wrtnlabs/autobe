import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformPrismaReviewHistories = (props: {
  analysis: Record<string, string>;
  application: AutoBePrisma.IApplication;
  schemas: Record<string, string>;
  component: AutoBePrisma.IComponent;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_SCHEMA,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_REVIEW,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Here is the requirement analysis report given by the user:
        
        \`\`\`json
        ${JSON.stringify(props.analysis)}
        \`\`\`
        
        Reading the requirement analysis report, you AI made 
        below AST definition for the database design:
        
        \`\`\`json
        ${JSON.stringify(props.application)}
        \`\`\`
        
        And here are the Prisma schema files generated (compiled) 
        from the above AST:
        
        \`\`\`json
        ${JSON.stringify(props.schemas)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Now, please review the tables in the "${props.component.namespace}" namespace.
        
        Focus your review exclusively on these tables.
        
        **Tables in this namespace:**
        ${props.component.tables.map((table) => `- ${table}`).join("\n")}
      `,
    },
  ];
};
