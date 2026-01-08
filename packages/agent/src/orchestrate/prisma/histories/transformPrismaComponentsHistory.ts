import { AutoBeDatabaseGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaComponentsHistory = (
  state: AutoBeState,
  props: {
    prefix: string | null;
    instruction: string;
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
    >;
    group: AutoBeDatabaseGroup;
  },
): IAutoBeOrchestrateHistory => {
  if (state.analyze === null)
    // unreachable
    throw new Error("Analyze state is not set.");
  if (props.prefix) props.prefix = NamingConvention.snake(props.prefix);
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
                  ## User Actor Handling

                  The Requirement Analysis Report contains the following user actors: ${state.analyze.actors.join(", ")}

                  **Do not normalize** user actors into a single table.
                  Instead, create separate tables for each distinct actor mentioned in the requirements.

                  Create separate tables for each actor:

                  ${state.analyze.actors
                    .map(
                      (actor) =>
                        `- ${props.prefix}_${actor.name.toLowerCase()}`,
                    )
                    .join("\n")}
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

      **CRITICAL REQUIREMENT**: You MUST load requirement analysis documents via 
      \`getAnalysisFiles\` to identify all entities and tables for this component.

      **MANDATORY STEPS**:
      
      1. **FIRST**: Call \`getAnalysisFiles\` to load requirement documents
         - NEVER skip this step - Requirements are the ONLY valid source for entity identification
      2. **THEN**: Analyze the LOADED requirements to identify all entities belonging to this component
      3. **FINALLY**: Generate complete table definitions covering ALL entities found in requirements

      **ABSOLUTE PROHIBITIONS**:
      
      - ❌ NEVER generate tables without loading requirement documents first
      - ❌ NEVER work from assumptions, imagination, or "typical patterns"
      - ❌ NEVER skip loading requirements under any circumstances

      Begin by calling \`getAnalysisFiles\` to load the requirement documents you need to analyze.
    `,
  };
};
