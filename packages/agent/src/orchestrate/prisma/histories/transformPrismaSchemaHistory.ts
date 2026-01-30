import { IMicroAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { singular } from "pluralize";
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
}): IAutoBeOrchestrateHistory => {
  const children: string[] = [props.component, ...props.otherComponents]
    .flatMap((c) => c.tables.map((t) => t.name))
    .filter((s) => s !== props.design.name)
    .filter((s) => s.startsWith(singular(props.design.name) + "_"));
  return {
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
      ...(children.length !== 0
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage",
              text: StringUtil.trim`
                ## Child Table Collision Warning

                The following child tables are already assigned to other
                agents, so do NOT recreate them and your child table names
                must NOT collide with any of them:

                ${children.map((t) => `- ${t}`).join("\n")}
              `,
            } satisfies IMicroAgenticaHistoryJson,
          ]
        : []),
    ],
    userMessage: "Make database schema please",
  };
};
