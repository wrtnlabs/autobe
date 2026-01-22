import { AutoBeInterfaceGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceBaseEndpointWriteHistory = (props: {
  state: AutoBeState;
  group: AutoBeInterfaceGroup;
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
        text: AutoBeSystemPromptConstant.INTERFACE_BASE_ENDPOINT_WRITE,
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

        ## Target Group for Design (YOUR TASK)

        You are designing base CRUD endpoints for the **${props.group.name}** group.

        \`\`\`json
        ${JSON.stringify(props.group)}
        \`\`\`

        Design base CRUD endpoints that cover all entities in this group.
        `,
      },
    ],
    userMessage: `Design endpoints for the ${props.group.name} group please`,
  };
};
