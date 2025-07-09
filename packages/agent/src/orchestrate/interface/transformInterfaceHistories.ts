import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeState } from "../../context/AutoBeState";

export const transformInterfaceHistories = (
  state: AutoBeState,
  systemMessage: string,
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
          "Don't call the any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
  else if (state.prisma === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.analyze.step !== state.prisma.step)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.prisma.compiled.type !== "success")
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: systemMessage,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Requirement analysis and Prisma DB schema generation are ready.",
        "",
        "Call the provided tool function to generate the OpenAPI document",
        "referencing below requirement analysis and Prisma DB schema.",
        "",
        // User Request
        `## User Request`,
        "",
        state.analyze.reason,
        "",
        "## Prefix",
        "",
        `* Prefix provided by the user: ${state.analyze?.prefix ?? null}`,
        `* When defining TypeScript interfaces, the interface name must be in PascalCase. The property names, however, do not need to follow this convention.`,
        "",
        "The user wants all TypeScript identifiers (such as interfaces, types, and functions) to start with the prefix provided below.  ",
        "If the prefix is `null`, it should be ignored.  ",
        "If a prefix is provided, all identifier names **must begin with it**.",
        "",
        "However, if there is a special-purpose prefix like `mv` (e.g., for materialized view handlers or performance-related utilities), it **must precede** the given prefix.",
        "",
        "## Prefix Example",
        "",
        "If the prefix is `shopping`, then names should be like:",
        "",
        "* `shoppingSales`",
        "* `shoppingSaleOptions`",
        "* `shoppingCreateSale()`",
        "",
        "In cases where an identifier is created for performance-optimized logic or special processing (e.g., materialized view handling), the `mv` prefix must come first.  ",
        "For example:",
        "",
        "* `mvShoppingDailyStats`",
        "* `mvShoppingAggregateView`",
        "",
        // Requirement Analysis Report
        `## Requirement Analysis Report`,
        "",
        "```json",
        JSON.stringify(state.analyze.files),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Database schema and entity relationship diagrams are ready.",
        "You should also look at this and consider logic including membership/login and token issuance.",
        "You can use table's name to define role in operations.",
        "",
        "## Prisma DB Schema",
        "```json",
        JSON.stringify(state.prisma.schemas),
        "```",
        "",
        "## Entity Relationship Diagrams",
        "```json",
        JSON.stringify(state.prisma.compiled.diagrams),
        "```",
      ].join("\n"),
    },
  ];
};
