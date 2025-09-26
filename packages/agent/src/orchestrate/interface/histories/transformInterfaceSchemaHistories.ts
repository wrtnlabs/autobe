import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaHistories = (props: {
  state: AutoBeState;
  operations: AutoBeOpenApi.IOperation[];
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
  },
  ...transformInterfaceAssetHistories(props.state),
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: StringUtil.trim`
      ## Operations

      Here is the list of API operations you have to implement its types:

      \`\`\`json
      ${JSON.stringify(props.operations)}
      \`\`\`

      ## Instructions

      The following API-spec instructions were extracted by AI from
      the user's utterances. These focus ONLY on API design aspects such as
      endpoint structure, request/response formats, authentication methods, etc.

      Reference these instructions when you create the JSON schema components.
      If the instruction is not related to any JSON schema components what
      you have to make, just ignore it.

      ${props.instruction}
    `,
  },
];
