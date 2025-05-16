import { IMicroAgenticaHistoryJson } from "@agentica/core";

import { AutoBeState } from "../../context/AutoBeState";

export const transformInterfaceStateMessage = (
  state: AutoBeState,
): IMicroAgenticaHistoryJson => ({
  type: "assistantMessage",
  text: predicate(state),
});

const predicate = (state: AutoBeState): string => {
  if (state.analyze === null)
    return [
      "Requirement analysis it not yet completed.",
      "Don't call the interface() tool function,",
      "but say to process the requirement analysis.",
    ].join(" ");
  else if (state.prisma === null)
    return [
      "Prisma DB schema generation is not yet completed.",
      "Don't call the interface() tool function,",
      "but say to process the Prisma DB schema generation.",
    ].join(" ");
  else if (state.prisma.step !== state.prisma.step)
    return [
      "Prisma DB schema generation has not been updated",
      "for the latest requirement analysis.",
      "Don't call the interface() tool function,",
      "but say to re-process the Prisma DB schema generation.",
    ].join(" ");
  else if (state.prisma.result.type !== "success")
    return [
      "Prisma DB schema generation has failed.",
      "Don't call the interface() tool function,",
      "but say to re-process the Prisma DB schema generation.",
    ].join(" ");
  return [
    "Requirement analysis and Prisma DB schema generation are ready.",
    "",
    "Call the interface() tool function to generate the OpenAPI document",
    "referencing below requirement analysis and Prisma DB schema.",
    "",
    // User Request
    `## User Request`,
    "",
    state.analyze.reason,
    "",
    // Requirement Analysis Report
    `## Requirement Analysis Report`,
    "\n",
    "```json",
    JSON.stringify(state.analyze.files),
    "```",
    "",
    // Prisma Schema Files
    "## Prisma DB Schema",
    "```json",
    JSON.stringify(state.prisma.result.files),
    "```",
    "",
    // Entity Relationship Diagram
    "## Entity Relationship Diagrams",
    "```json",
    JSON.stringify(state.prisma.result.diagrams),
    "```",
  ].join("\n");
};
