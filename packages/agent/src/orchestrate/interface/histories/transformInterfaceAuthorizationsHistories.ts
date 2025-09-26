import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeHistory, AutoBeAnalyzeRole } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceAuthorizationsHistories = (props: {
  state: AutoBeState;
  role: AutoBeAnalyzeRole;
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
      text: AutoBeSystemPromptConstant.INTERFACE_AUTHORIZATION,
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
        You have to make API operations for the given role:

        ## Role

        \`\`\`json
        ${JSON.stringify(props.role)}
        \`\`\`

        ## Instructions

        The following API-specific instructions were extracted by AI from
        the user's utterances. These focus ONLY on API design aspects such as
        endpoint structure, request/response formats, authentication methods, etc.

        Reference these instructions when you design the authorization related
        operations. If the instruction is not related to the authorization
        operation about the given role (${JSON.stringify(props.role)}), 
        just ignore it.

        ${props.instruction}
      `,
    },
  ];
};
