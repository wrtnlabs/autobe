import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaSchemaHistory = (props: {
  otherComponents: AutoBeDatabaseComponent[];
  component: AutoBeDatabaseComponent;
  design: AutoBeDatabaseComponentTableDesign;
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
          targetComponent: props.component,
          otherComponents: props.otherComponents,
        })}
        \`\`\`

        ## Table Context

        You are generating the database schema for the target table:

        - Component Namespace: ${props.component.namespace}
        - Target Table Name: ${props.design.name}
        - Target Table Summary: ${props.design.description}
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        ## Critical Reminder: Target Table and Child Tables

        You must create models for the target table specified below.
        The target table model is MANDATORY, and you may also create
        child tables that follow the First Normal Form (1NF) principle —
        when a column would contain repeating groups or non-atomic values,
        split them into separate child tables.

        Child table names must start with the singular form of the target
        table name as a prefix (e.g., for target "shopping_orders", child
        tables must be named like "shopping_order_items",
        "shopping_order_payments", etc.).

        Child table names must NOT collide with tables already assigned
        to other components or other tables in the same component.
        Do NOT create models for other tables already listed in the
        component or other components — they are handled separately.

        \`\`\`json
        ${JSON.stringify({
          targetComponent: props.component,
          targetTable: props.design.name,
          targetTableSummary: props.design.description,
        })}
        \`\`\`
      `,
    },
  ],
  userMessage: "Make database schema please",
});
