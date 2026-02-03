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
import { transformInterfaceEndpointAuthorizationSection } from "./transformInterfaceEndpointAuthorizationSection";

export const transformInterfaceBaseEndpointReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
  designs: AutoBeInterfaceEndpointDesign[];
  group: AutoBeInterfaceGroup;
  authorizeOperations: AutoBeOpenApi.IOperation[];
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_BASE_ENDPOINT_WRITE,
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
        ## Target Group

        You are reviewing endpoints for the **${props.group.name}** group.

        - **Description**: ${props.group.description}
        - **Related Database Schemas**: ${props.group.databaseSchemas.join(", ")}

        ${transformInterfaceEndpointAuthorizationSection(props.authorizeOperations)}
        
        ## Base CRUD Endpoint Designs for Review (YOUR TASK)

        ⚠️ CRITICAL: You MUST provide a revision for EVERY endpoint listed below.

        - Use **keep** to approve endpoints that are correct
        - Use **update** to fix endpoints with issues
        - Use **erase** to remove invalid endpoints
        - Use **create** to add missing endpoints

        DO NOT omit any endpoint. DO NOT reference endpoints not listed here.

        \`\`\`json
        ${JSON.stringify(props.designs)}
        \`\`\`

        Review according to the criteria in the system prompt. Call \`process()\` with \`type: "complete"\` containing all \`revises\`.
      `,
      created_at: new Date().toISOString(),
    },
  ],
  userMessage: `Review the base CRUD endpoints for the ${props.group.name} group and fix any issues found.`,
});
