import { AutoBeAnalyzeActor, AutoBeAnalyzeHistory } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceAuthorizationHistory = (props: {
  state: AutoBeState;
  actor: AutoBeAnalyzeActor;
  preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  const analyze: AutoBeAnalyzeHistory = props.state.analyze!;
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_AUTHORIZATION,
      },
      ...props.preliminary.createHistories(),
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
          ## API Design Instructions

          The following API-specific instructions were extracted from
          the user's requirements. These focus on API interface design aspects
          such as endpoint patterns, request/response formats, DTO schemas,
          and operation specifications.

          Follow these instructions when designing authorization operations for ${props.actor.name}.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Actor

          You have to make API operations for the given actor:

          \`\`\`json
          ${JSON.stringify(props.actor)}
          \`\`\`
        `,
      },
    ],
    userMessage: `Make authorization operations for ${props.actor.name} actor please`,
  };
};
