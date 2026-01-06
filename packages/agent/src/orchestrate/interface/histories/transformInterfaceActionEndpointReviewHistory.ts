import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceActionEndpointReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  designs: AutoBeInterfaceEndpointDesign[];
  baseEndpoints: AutoBeOpenApi.IEndpoint[];
  authorizations: AutoBeOpenApi.IOperation[];
  group: AutoBeInterfaceGroup;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_ACTION_ENDPOINT_WRITE,
    },
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_ACTION_ENDPOINT_REVIEW,
    },
    ...props.preliminary.getHistories(),
    {
      id: v7(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Authorization Endpoints (Reference - Already Exist)

        These authorization endpoints already exist. For reference only:

        \`\`\`json
        ${JSON.stringify(
          props.authorizations.map((op) => ({
            path: op.path,
            method: op.method,
          })),
          null,
          2,
        )}
        \`\`\`

        ## Base CRUD Endpoints (Reference - Already Exist)

        These base CRUD endpoints already exist. For reference only:

        \`\`\`json
        ${JSON.stringify(props.baseEndpoints)}
        \`\`\`

        ## Target Group

        You are reviewing endpoints for the **${props.group.name}** group.

        - **Description**: ${props.group.description}
        - **Related Database Schemas**: ${props.group.databaseSchemas.join(", ")}

        ## Action Endpoint Designs for Review (YOUR TASK)

        ⚠️ CRITICAL: These are the ONLY endpoints you can review.

        You can ONLY create new endpoints, update these endpoints, or erase these endpoints.
        
        DO NOT reference any endpoint that is not listed here.

        \`\`\`json
        ${JSON.stringify(props.designs, null, 2)}
        \`\`\`

        Review according to the criteria in the system prompt. Call \`process()\` with \`type: "complete"\` containing all \`revises\`.
      `,
      created_at: new Date().toISOString(),
    },
  ],
  userMessage: `Review the action endpoints for the ${props.group.name} group and fix any issues found.`,
});
