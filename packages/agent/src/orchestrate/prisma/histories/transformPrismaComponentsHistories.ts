import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";

export const transformPrismaComponentsHistories = (
  state: AutoBeState,
  props: {
    prefix: string | null;
    instruction: string;
  },
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    // unreachable
    throw new Error("Analyze state is not set.");
  if (props.prefix) props.prefix = NamingConvention.snake(props.prefix);
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_COMPONENT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Requirement Analysis Report

        Here is the requirement analysis report.
        
        Call the provided tool function to generate Prisma DB schema
        referencing below requirement analysis report.
        
        \`\`\`json
        ${JSON.stringify(state.analyze.files)}
        \`\`\`
        
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
          state.analyze.roles.length > 0
            ? StringUtil.trim`
                ## User Role Handling
                
                The Requirement Analysis Report contains the following user roles: ${state.analyze.roles.join(", ")}
                
                **Do not normalize** user roles into a single table.
                Instead, create separate tables for each distinct role mentioned in the requirements.
                
                Create separate tables for each role:
                
                ${state.analyze.roles
                  .map((role) => `- ${props.prefix}_${role.name.toLowerCase()}`)
                  .join("\n")}
              `
            : ""
        }

        ## Database Design Instructions

        The following database-specific instructions were extracted by AI from
        the user's utterances. These focus ONLY on database schema design aspects
        such as table structure, relationships, constraints, and indexing strategies.

        Reference these instructions when designing namespace components and 
        DB table names.

        ${props.instruction}
      `,
    },
  ];
};
