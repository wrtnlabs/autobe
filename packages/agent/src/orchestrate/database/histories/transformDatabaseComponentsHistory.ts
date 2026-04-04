import { AutoBeDatabaseGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformDatabaseComponentsHistory = (
  state: AutoBeState,
  props: {
    prefix: string | null;
    instruction: string;
    preliminary: AutoBePreliminaryController<
      | "analysisSections"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
    >;
    group: AutoBeDatabaseGroup;
  },
): IAutoBeOrchestrateHistory => {
  if (state.analyze === null)
    // unreachable
    throw new Error("Analyze state is not set.");
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_COMPONENT,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Database Component Skeleton

          You are designing database tables for the following component:

          **Filename**: \`${props.group.filename}\`
          **Namespace**: \`${props.group.namespace}\`

          **Component Reasoning**:
          - **Thinking**: ${props.group.thinking}
          - **Review**: ${props.group.review}
          - **Rationale**: ${props.group.rationale}

          Your task is to extract the detailed table names for THIS SINGLE COMPONENT ONLY.

          **CRITICAL**: Use the EXACT filename and namespace provided above.
          You are filling in the \`tables\` field to complete this component skeleton.

          ## Prefix
          
          - Prefix provided by the user: ${props.prefix}
          
          The user wants all database schema (table) names to start with the prefix provided below.
          
          - DO: Use the provided prefix for all table names
          - DO: Place special-purpose prefixes like \`mv\` (for materialized views) before the given prefix
          - DO NOT: Apply prefix if it is \`null\`
          
          ## Prefix Example
          
          If the prefix is \`shopping\`, then table names are like:
          
          - \`shopping_sales\`
          - \`shopping_sale_options\`
          
          In cases where a table is created for performance optimization purposes 
          (e.g., materialized views), the \`mv_\` prefix must come first. For example:
          
          - \`mv_shopping_daily_stats\`
          
          ${
            state.analyze.actors.length > 0
              ? StringUtil.trim`
                  ## ABSOLUTE PROHIBITION: Actor and Authorization Tables

                  The requirements contain the following actors: ${state.analyze.actors.map((a) => a.name).join(", ")}

                  **YOU MUST NOT CREATE ANY ACTOR OR AUTHENTICATION TABLES.**

                  The **Database Authorization Agent** is responsible for generating all actor-related tables.
                  That agent creates the \`schema-02-actors.prisma\` component with tables like:

                  ${state.analyze.actors
                    .map(
                      (actor) =>
                        `- ${props.prefix ? props.prefix + "_" : ""}${actor.name.toLowerCase()}s (FORBIDDEN - created by Authorization Agent)
- ${props.prefix ? props.prefix + "_" : ""}${actor.name.toLowerCase()}_sessions (FORBIDDEN - created by Authorization Agent)`,
                    )
                    .join("\n")}

                  **What To Do Instead**:
                  - Create business domain tables that REFERENCE actors via foreign keys
                  - ASSUME actor tables already exist
                  - NEVER create the actor table itself

                  **If you receive an "Actors" component skeleton**, return an EMPTY tables array:
                  \`{ type: "write", analysis: "Actors handled by Authorization Agent", rationale: "Skipped", tables: [] }\`
                `
              : ""
          }

          ## Database Design Instructions

          The following database-specific instructions were extracted from
          the user's requirements. These focus on database schema design aspects
          such as table structure, relationships, constraints, and indexing strategies.

          Follow these instructions when designing namespace components and DB table names. 
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)
          
          When instructions contain direct specifications or explicit design decisions, 
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      ## Your Task: Design Database Tables for This Component

      Identify all entities belonging to this component's domain and generate complete table definitions covering them.

      When ready, call \`process({ request: { type: "write", ... } })\` with the table definitions.
    `,
  };
};
