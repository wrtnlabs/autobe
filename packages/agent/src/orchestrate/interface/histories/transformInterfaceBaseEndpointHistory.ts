import { AutoBeInterfaceGroup, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceBaseEndpointHistory = (props: {
  state: AutoBeState;
  group: AutoBeInterfaceGroup;
  authorizations: AutoBeOpenApi.IOperation[];
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  >;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_BASE_ENDPOINT,
      },
      ...props.preliminary.getHistories(),
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

        Follow these instructions when designing base endpoints for the ${props.group.name} group.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Group Information

        Here is the target group for the endpoints:

        \`\`\`json
        ${JSON.stringify(props.group)}
        \`\`\`

        ## Already Existing Endpoints

        These Endpoints already exist. Do NOT create similar endpoints:

        \`\`\`json
        ${JSON.stringify(
          props.authorizations.map((op) => ({
            path: op.path,
            method: op.method,
            name: op.name,
            summary: StringUtil.summary(op.description),
          })),
        )}
        \`\`\`
        `,
      },
    ],
    userMessage: `Design endpoints for the ${props.group.name} group please`,
  };
};
