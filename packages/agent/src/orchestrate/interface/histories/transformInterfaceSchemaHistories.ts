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

      The following API-specific instructions were extracted by AI from
      the user's utterances. These focus ONLY on API interface design aspects
      such as endpoint patterns, request/response formats, DTO schemas,
      and operation specifications.

      Apply these instructions when creating JSON schema components for the operations.
      Focus on data structure design, field naming conventions, validation rules,
      and type definitions. If the instructions are not relevant to the schema
      components you need to create, you may ignore them.

      ${props.instruction}

      ## Operations

      Here is the list of API operations you have to implement its types:

      \`\`\`json
      ${JSON.stringify(props.operations)}
      \`\`\`
    `,
  },
];
