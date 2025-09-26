import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceComplementHistories = (props: {
  state: AutoBeState;
  instruction: string;
  missed: string[];
  document: AutoBeOpenApi.IDocument;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
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
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
  },
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_COMPLEMENT,
  },
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: StringUtil.trim`
      ## Operations

      Here is the OpenAPI operations what you AI have made:

      \`\`\`json
      ${JSON.stringify(props.document.operations)}
      \`\`\`

      ## Schemas

      Here is the OpenAPI schemas what you AI have made:

      \`\`\`json
      ${JSON.stringify(props.document.components.schemas)}
      \`\`\`

      ## Missed Types

      However, you AI have missed below schema types:

      ${props.missed.map((s) => `- ${s}`).join("\n")}

      ## API Design Instructions

      The following API-specific instructions were extracted by AI from
      the user's utterances. These focus ONLY on API design aspects such as
      endpoint structure, request/response formats, authentication methods, etc.

      Reference these instructions when designing the type schemas 
      you have missed. If the instruction is not related to the type schemas 
      you have missed (have to make), just ignore it.

      ${props.instruction}
    `,
  },
];
