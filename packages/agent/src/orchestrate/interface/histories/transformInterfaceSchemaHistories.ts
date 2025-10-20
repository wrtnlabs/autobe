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
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_COMPOSITION,
  },
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_COMPOSITION,
  },
  ...transformInterfaceAssetHistories(props.state),
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: StringUtil.trim`
      ## API Design Instructions

      The following API-specific instructions were extracted from
      the user's requirements. These focus on API interface design aspects
      such as endpoint patterns, request/response formats, DTO schemas,
      and operation specifications.

      Follow these instructions when creating JSON schema components. 
      Carefully distinguish between:
      - Suggestions or recommendations (consider these as guidance)
      - Direct specifications or explicit commands (these must be followed exactly)
      
      When instructions contain direct specifications or explicit design decisions, 
      follow them precisely even if you believe you have better alternatives.

      ${props.instruction}

      ## Operations

      Here is the list of API operations you have to implement its types:

      \`\`\`json
      ${JSON.stringify(props.operations)}
      \`\`\`
    `,
  },
];
