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

      ## Instructions

      The following API-specific instructions were extracted by AI from
      the user's utterances. These focus ONLY on API design aspects such as
      endpoint structure, request/response formats, authentication methods, etc.

      Reference these instructions when you design the endpoints for the given
      group (${JSON.stringify(props.group)}). If the instruction is not related
      to the endpoints about the given group, just ignore it.

      ${props.instruction}
    `,
  },
];
