import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeHistory, AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceOperationHistories = (
  state: AutoBeState,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const analyze: AutoBeAnalyzeHistory = state.analyze!;
  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        `## Service Prefix`,
        `- Original: ${analyze.prefix}`,
        `- PascalCase for DTOs: ${analyze.prefix
          .split(/[-_]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")}`,
        `- Expected DTO pattern: I${analyze.prefix
          .split(/[-_]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")}{EntityName}`,
      ].join("\n"),
    },
    {
      type: "assistantMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        "You have to make API operations for the given endpoints:",
        "",
        "```json",
        JSON.stringify(endpoints),
        "```",
        "",
        "If there is a content in the failure, it is to explain why it failed before.",
        "Please supplement or modify the Operation accordingly.",
      ].join("\n"),
    },
  ];
};
