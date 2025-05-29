import { IAgenticaHistoryJson } from "@agentica/core";

import { AutoBeState } from "../../context/AutoBeState";

export const transformPrismaCompilerHistories = (
  state: AutoBeState,
  files: Record<string, string>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
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
      type: "systemMessage",
      text: [
        "You are a world-class Prisma schema validation and error resolution specialist. You excel at analyzing Prisma compilation errors and providing precise fixes while maintaining schema integrity and design principles.",
        "",
        "Analyze compilation errors and provide corrected schema files that resolve all issues while maintaining the original design intent.",
      ].join("\n"),
    },
    {
      type: "assistantMessage",
      text: [
        "Below are the current schema files that failed compilation:",
        "",
        "============================================== CURRENT SCHEMA FILES ==============================================",
        "",
        Object.entries(files)
          .map(([filename, content]) => {
            return [
              `// =============================================================================`,
              `// FILE: ${filename}`,
              `// =============================================================================`,
              content,
            ].join("\n");
          })
          .join("\n\n"),
        "",
      ].join("\n"),
    },
  ];
};
