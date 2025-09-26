import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeHistory, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceOperationHistories = (props: {
  state: AutoBeState;
  endpoints: AutoBeOpenApi.IEndpoint[];
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const analyze: AutoBeAnalyzeHistory = props.state.analyze!;
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
    },
    ...transformInterfaceAssetHistories(props.state),
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
        ## API Design Instructions

        The following API-specific instructions were extracted by AI from
        the user's utterances. These focus ONLY on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        Apply these instructions when designing the detailed operation specifications
        for each endpoint. Consider parameter types, request/response structures,
        error handling, and API behavior patterns. If the instructions are not
        relevant to the operations you need to implement, you may ignore them.

        ${props.instruction}

        ## Operations

        You have to make API operations for the given endpoints:

        \`\`\`json
        ${JSON.stringify(props.endpoints)}
        \`\`\`

        If there is a content in the failure, it is to explain why it failed before.
        Please supplement or modify the Operation accordingly.
      `,
    },
  ];
};
