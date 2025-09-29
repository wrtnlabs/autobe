import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceEndpointHistories = (props: {
  state: AutoBeState;
  group: AutoBeInterfaceGroup;
  authorizations: AutoBeOpenApi.IOperation[];
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
  },
  ...transformInterfaceAssetHistories(props.state),
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

      Apply these instructions when designing endpoints for the ${props.group.name} group.
      Consider the specified URL patterns, HTTP methods, parameter structures,
      and response formats. If the instructions are not relevant to this specific
      endpoint group, you may ignore them.

      ${props.instruction}

      ## Group Information

      Here is the target group for the endpoints:

      \`\`\`json
      ${JSON.stringify(props.group)}
      \`\`\`

      ## Already Existing Operations

      These operations already exist. Do NOT create similar endpoints:

      \`\`\`json
      ${JSON.stringify(
        props.authorizations.map((op) => ({
          path: op.path,
          method: op.method,
          name: op.name,
          summary: op.summary,
        })),
      )}
      \`\`\`
    `,
  },
];
