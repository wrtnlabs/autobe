import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export const transformPrismaComponentsHistories = (
  state: AutoBeState,
  prefix: string | null = null,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Requirement analysis is not yet completed.",
          "Don't call any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
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
        "If the prefix is `null`, it should be ignored.",
        "If a prefix is provided, all table names **must begin with it**.",
        "However, if there is a special-purpose prefix like `mv` (for materialized views), it **must precede** the given prefix.",
        "",
        "## Prefix Example",
        "",
        "If the prefix is `shopping`, then table names should be like:",
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
