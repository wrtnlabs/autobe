import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceSchemaReviewHistory = (props: {
  state: AutoBeState;
  systemPrompt: string;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >;
  typeName: string;
  reviewOperations: AutoBeOpenApi.IOperation[];
  reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: props.systemPrompt,
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
        relevant to the review task.

        Follow these instructions when reviewing and fixing schemas.
        Carefully distinguish between:

        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
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

        ## Operations (Filtered for Target Schema)

        Here are the API operations that directly use the schema under review.
        These operations reference the target schema "${props.typeName}" via
        requestBody.typeName or responseBody.typeName.

        This FILTERED list helps you understand the exact usage context for
        the schema you're reviewing:

        \`\`\`json
        ${JSON.stringify(props.reviewOperations)}
        \`\`\`

        ## DTO type to review

        Here is the SPECIFIC schema that needs review for type "${props.typeName}":

        \`\`\`json
        ${JSON.stringify(props.reviewSchema)}
        \`\`\`

        IMPORTANT: Only this schema needs review and potential modification.
        Other schemas in the complete schema set are provided for reference 
        only.
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Review ${JSON.stringify(props.typeName)} type named JSON schema 
    component based on the provided API design instructions and 
    relevant operations.

    Note that, when making changes, what you make is not
    "Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>" type,
    but "AutoBeOpenApi.IJsonSchemaDescriptive" type directly for
    the ${JSON.stringify(props.typeName)} type.
  `,
});
