import { IAgenticaHistoryJson } from "@agentica/core";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";

export const transformPrismaComponentsHistories = (
  state: AutoBeState,
  prefix: string | null = null,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    // unreachable
    throw new Error("Analyze state is not set.");
  if (prefix) prefix = NamingConvention.snake(prefix);
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.PRISMA_COMPONENT,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here is the requirement analysis report.",
        "",
        "Call the provided tool function to generate Prisma DB schema",
        "referencing below requirement analysis report.",
        "",
        `## Requirement Analysis Report`,
        "",
        "```json",
        JSON.stringify(state.analyze.files),
        "```",
        "## Prefix",
        "",
        `* Prefix provided by the user: ${prefix}`,
        "",
        "The user wants all database schema (table) names to start with the prefix provided below.",
        "",
        "DO: Use the provided prefix for all table names",
        "DO: Place special-purpose prefixes like `mv` (for materialized views) before the given prefix",
        "DO NOT: Apply prefix if it is `null`",
        "",
        "## Prefix Example",
        "",
        "If the prefix is `shopping`, then table names are like:",
        "",
        "* `shopping_sales`",
        "* `shopping_sale_options`",
        "",
        "In cases where a table is created for performance optimization purposes (e.g., materialized views), the `mv_` prefix must come first.",
        "For example:",
        "",
        "* `mv_shopping_daily_stats`",
        "",
        "",
        state.analyze.roles.length > 0
          ? [
              "## User Role Handling",
              "",
              `The Requirement Analysis Report contains the following user roles: ${state.analyze.roles.join(", ")}.`,
              "",
              "**Do not normalize** user roles into a single table.",
              "Instead, create separate tables for each distinct role mentioned in the requirements.",
              "",
              "Create separate tables for each role:",
              "",
              state.analyze.roles
                .map((role) => `* ${prefix}_${role.name.toLowerCase()}`)
                .join("\n"),
              "",
            ].join("\n")
          : "",
      ].join("\n"),
    },
  ];
};
