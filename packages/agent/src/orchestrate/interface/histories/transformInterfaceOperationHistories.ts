import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeHistory, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

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
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Service Prefix
        - Original: ${analyze.prefix}
        - PascalCase for DTOs: ${analyze.prefix
          .split(/[-_]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")}
        - Expected DTO pattern: I${analyze.prefix
          .split(/[-_]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("")}{EntityName}
      `,
    },
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        You have to make API operations for the given endpoints:

        \`\`\`json
        ${JSON.stringify(endpoints)}
        \`\`\`

        If there is a content in the failure, it is to explain why it failed before.
        Please supplement or modify the Operation accordingly.
      `,
    },
  ];
};
