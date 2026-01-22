import { AutoBeInterfaceGroup, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceActionEndpointWriteHistory = (props: {
  state: AutoBeState;
  group: AutoBeInterfaceGroup;
  baseEndpoints: AutoBeOpenApi.IEndpoint[];
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
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
        text: AutoBeSystemPromptConstant.INTERFACE_ACTION_ENDPOINT_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
        ## API Design Instructions (Reference)

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Base CRUD Endpoints (Reference - Already Exist)

        These base CRUD endpoints already exist. Do NOT create similar endpoints.
        Action endpoints should complement these, not duplicate them:

        \`\`\`json
        ${JSON.stringify(props.baseEndpoints)}
        \`\`\`

        ## Target Group for Design (YOUR TASK)

        You are designing action endpoints for the **${props.group.name}** group.

        \`\`\`json
        ${JSON.stringify(props.group)}
        \`\`\`

        Design action endpoints that fulfill the requirements for this group.
        `,
      },
    ],
    userMessage: `Design action endpoints for the ${props.group.name} group please`,
  };
};
