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
      ## API Design Instructions

      The following API-specific instructions were extracted from
      the user's requirements. These focus on API interface design aspects
      such as endpoint patterns, request/response formats, DTO schemas,
      and operation specifications.

      These instructions are provided as reference when creating JSON schema 
      components for the operations. They cover data structure design, field 
      naming conventions, validation rules, and type definitions.

      ${props.instruction}

      ## Operations

      Here is the list of API operations you have to implement its types:

      \`\`\`json
      ${JSON.stringify(props.operations)}
      \`\`\`
    `,
  },
];
