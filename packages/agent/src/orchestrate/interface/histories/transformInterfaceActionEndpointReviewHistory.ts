import { AutoBeInterfaceGroup, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeInterfaceActionEndpointApplication } from "../structures/IAutoBeInterfaceActionEndpointApplication";

export const transformInterfaceActionEndpointReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  >;
  endpoints: IAutoBeInterfaceActionEndpointApplication.IEndpoint[];
  baseEndpoints: AutoBeOpenApi.IEndpoint[];
  authorizations: AutoBeOpenApi.IOperation[];
  group: AutoBeInterfaceGroup;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_ACTION_ENDPOINT,
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
        ## Group Context

        You are reviewing endpoints for the **${props.group.name}** group.
        Group description: ${props.group.description}
        Related Prisma schemas: ${props.group.prismaSchemas.join(", ")}

        ## Action Endpoints for Review (ONLY THESE EXIST)

        ⚠️ CRITICAL: You can ONLY update or delete endpoints from this list.
        DO NOT reference any endpoint that is not listed here.

        \`\`\`json
        ${JSON.stringify(props.endpoints)}
        \`\`\`

        ## Base CRUD Endpoints (Already Exist)

        \`\`\`json
        ${JSON.stringify(props.baseEndpoints)}
        \`\`\`

        ## Authorization Endpoints (Already Exist)

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

        Review according to the criteria in the system prompt. Call \`process()\` with \`type: "complete"\` containing all \`actions\`.
      `,
      created_at: new Date().toISOString(),
    },
  ],
  userMessage: `Review the action endpoints for the ${props.group.name} group and fix any issues found.`,
});
