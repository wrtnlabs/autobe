import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaSchemaHistory = (props: {
  targetComponent: AutoBeDatabaseComponent;
  targetTable: string;
  otherComponents: AutoBeDatabaseComponent[];
  instruction: string;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.DATABASE_SCHEMA,
    },
    ...props.preliminary.getHistories(),
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

        ## Component Context
        
        Here is the component context for generating DB schema.
        
        \`\`\`json
        ${JSON.stringify({
          targetComponent: props.targetComponent,
          otherComponents: props.otherComponents,
        })}
        \`\`\`

        ## Table Context

        You are generating the database schema for the table:

        - Component Namespace: ${props.targetComponent.namespace}
        - Table Name: ${props.targetTable}
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        ## Critical Reminder: Single Table Focus

        You must create ONLY the target model specified below.
        Do NOT create models for other tables - they are handled separately.

        \`\`\`json
        ${JSON.stringify({
          targetComponent: props.targetComponent,
          targetTable: props.targetTable,
        })}
        \`\`\`
      `,
    },
  ],
  userMessage: "Make database schema please",
});
