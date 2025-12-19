import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeInterfaceBaseEndpointApplication } from "../structures/IAutoBeInterfaceBaseEndpointApplication";

export const transformInterfaceBaseEndpointReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  >;
  endpoints: IAutoBeInterfaceBaseEndpointApplication.IEndpoint[];
  authorizations: AutoBeOpenApi.IOperation[];
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_BASE_ENDPOINT,
      },
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_BASE_ENDPOINT_REVIEW,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        type: "assistantMessage",
        text: StringUtil.trim`
        ## Base CRUD Endpoints for Review (ONLY THESE EXIST)

        ⚠️ CRITICAL: You can ONLY update or delete endpoints from this list.
        DO NOT reference any endpoint that is not listed here.

        \`\`\`json
        ${JSON.stringify(props.endpoints)}
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
    userMessage: "Review the base CRUD endpoints and fix any issues found.",
  };
};
