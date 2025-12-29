import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceComplementHistory = (props: {
  state: AutoBeState;
  instruction: string;
  missed: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousInterfaceSchemas"
    | "previousInterfaceOperations"
    | "previousPrismaSchemas"
  >;
}): IAutoBeOrchestrateHistory => ({
  histories: [
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

        Follow these instructions when completing missing schema types.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Missed Type

        You need to create a schema definition for this missing type:

        **${props.missed}**

        This type is referenced in API operations but not yet defined in
        components.schemas. Create a complete JSON schema definition for it.
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Complete the missing schema type ${JSON.stringify(props.missed)} 
    based on the provided API design instructions.

    Note that, not making "Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>"
    type, but making "AutoBeOpenApi.IJsonSchemaDescriptive" type directly for
    the ${JSON.stringify(props.missed)} type.
  `,
});
