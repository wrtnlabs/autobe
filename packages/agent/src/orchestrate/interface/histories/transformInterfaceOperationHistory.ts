import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceOperationHistory = (props: {
  prefix: string;
  endpoints: AutoBeOpenApi.IEndpoint[];
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
      },
      ...props.preliminary.getHistories(),
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Service Prefix
          - Original: ${props.prefix}
          - PascalCase for DTOs: ${props.prefix
            .split(/[-_]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("")}
          - Expected DTO pattern: I${props.prefix
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

          The following API-specific instructions were extracted from
          the user's requirements. These focus on API interface design aspects
          such as endpoint patterns, request/response formats, DTO schemas,
          and operation specifications.

          Follow these instructions when designing operation specifications.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

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
    ],
    userMessage:
      "Create API operation specifications for the given endpoints please",
  };
};
