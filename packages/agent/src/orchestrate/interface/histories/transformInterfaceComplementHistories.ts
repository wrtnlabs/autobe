import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceComplementHistories = (props: {
  state: AutoBeState;
  instruction: string;
  missed: string[];
  document: AutoBeOpenApi.IDocument;
}): IAutoBeOrchestrateHistory => ({
  histories: [
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
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        Follow these instructions when completing missing schema types.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

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
      `,
    },
  ],
  userMessage: "Complete the missing schema types please",
});
