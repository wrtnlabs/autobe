import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformPrismaSchemaHistories = (props: {
  analysis: Record<string, string>;
  targetComponent: AutoBePrisma.IComponent;
  otherTables: string[];
  instruction: string;
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
      type: "assistantMessage",
      text: StringUtil.trim`
        Here is the requirement analysis report:

        \`\`\`json
        ${JSON.stringify(props.analysis)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Database Design Instructions

        The following database-specific instructions were extracted by AI from
        the user's utterances. These focus ONLY on database schema design aspects
        such as table structure, relationships, constraints, and indexing strategies.

        Reference these instructions when designing the DB schema for this specific
        component. If the instruction is not related to the current domain or
        component, you may ignore it.

        ${props.instruction}

        ## Target Component
        
        Here is the input data for generating Prisma DB schema.
        
        \`\`\`json
        ${JSON.stringify({
          targetComponent: props.targetComponent,
          otherTables: props.otherTables,
        })}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        You've already taken a mistake that creating models from the other components.

        Note that, you have to make models from the target component only. Never make
        models from the other components. The other components' models are already made.
        
        \`\`\`json
        ${JSON.stringify({
          targetComponent: props.targetComponent,
        })}
        \`\`\`
      `,
    },
  ];
};
