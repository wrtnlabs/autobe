import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceSchemaHistory = (props: {
  operations: AutoBeOpenApi.IOperation[];
  typeName: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
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

          Follow these instructions when creating JSON schema.

          Carefully distinguish between:
          
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Operations (Filtered for Target Schemas)

          Here is the list of API operations that directly use the schemas
          you need to generate (via requestBody.typeName or responseBody.typeName).

          These are the ONLY operations relevant to your current task - other
          operations have been filtered out to reduce noise and improve focus:

          \`\`\`json
          ${JSON.stringify(props.operations)}
          \`\`\`

          ## DTO type to create
          
          Here is the specific type you need to create a JSON schema component for.
          
          - ${JSON.stringify(props.typeName)}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Make ${JSON.stringify(props.typeName)} type named JSON schema component 
      based on the provided API design instructions and relevant operations.

      Note that, not making "Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>" 
      type, but making "AutoBeOpenApi.IJsonSchemaDescriptive" type directly for 
      the ${JSON.stringify(props.typeName)} type.
    `,
  };
};
