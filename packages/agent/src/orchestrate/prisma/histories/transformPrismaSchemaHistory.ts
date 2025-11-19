import { AutoBePrisma } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformPrismaSchemaHistory = (props: {
  analysis: Record<string, string>;
  targetComponent: AutoBePrisma.IComponent;
  otherTables: string[];
  instruction: string;
}): IAutoBeOrchestrateHistory => ({
  histories: [
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

        The following database-specific instructions were extracted from
        the user's requirements. These focus on database schema design aspects
        such as table structure, relationships, constraints, and indexing strategies.

        Follow these instructions when designing the DB schema. Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)
        
        When instructions contain direct specifications or explicit design decisions, 
        follow them precisely even if you believe you have better alternatives.

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
  ],
  userMessage: "Make prisma schema file please",
});
