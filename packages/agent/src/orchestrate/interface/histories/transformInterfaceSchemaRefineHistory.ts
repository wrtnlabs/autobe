import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformInterfaceSchemaRefineHistory = (props: {
  state: AutoBeState;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >;
  typeName: string;
  refineOperations: AutoBeOpenApi.IOperation[];
  refineSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REFINE,
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
        relevant to the refinement task.

        Follow these instructions when enriching schemas with documentation
        and metadata.
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
        ## Operations (Filtered for Target Schema)

        Here are the API operations that directly use the schema to refine.
        These operations reference the target schema "${props.typeName}" via
        requestBody.typeName or responseBody.typeName.

        This FILTERED list helps you understand the exact usage context for
        the schema you're enriching:

        \`\`\`json
        ${JSON.stringify(props.refineOperations)}
        \`\`\`

        ## DTO type to refine

        Here is the SPECIFIC schema that needs refinement for type "${props.typeName}":

        \`\`\`json
        ${JSON.stringify(props.refineSchema)}
        \`\`\`

        Also, here is the list of properties currently defined in this schema,
        so you have to enrich them one by one:

        ${Object.keys(props.refineSchema.properties)
          .map((k) => `- ${k}`)
          .join("\n")}

        IMPORTANT: Only this schema needs refinement. Other schemas in the
        complete schema set are provided for reference only.
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Refine ${JSON.stringify(props.typeName)} schema by enriching each property
    with \`databaseSchemaProperty\`, \`specification\`, and \`description\`.

    **Object-level**: \`databaseSchema\` (nullable), \`specification\` (MANDATORY),
    \`description\` (MANDATORY).

    **Property-level**: Use \`depict\`, \`create\`, \`update\`, or \`erase\` for each.

    When \`databaseSchemaProperty\` or \`databaseSchema\` is \`null\`, the
    \`specification\` becomes the ONLY source of truth for downstream agents.

    You MUST provide a refinement for every single property without exception:
    ${Object.keys(props.refineSchema.properties)
      .map((k) => `- ${k}`)
      .join("\n")}
  `,
});
