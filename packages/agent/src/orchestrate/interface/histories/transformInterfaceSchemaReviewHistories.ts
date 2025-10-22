import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaReviewHistories = (
  state: AutoBeState,
  document: AutoBeOpenApi.IDocument,
  schema: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const operations = document.operations.filter(
    (op) =>
      (op.requestBody && !!schema[op.requestBody.typeName]) ||
      (op.responseBody && !!schema[op.responseBody.typeName]),
  );
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Operations

        The Schema Agent has generated schemas for the following 
        API operations. These operations define what endpoints exist 
        and what request/response types they use:

        \`\`\`json
        ${JSON.stringify(document.operations)}
        \`\`\`

        All schema types referenced in these operations (in requestBody 
        and responses) must exist in the schemas.

        ## Schemas

        Here is the COMPLETE set of all schemas in the system for 
        reference context:

        \`\`\`json
        ${JSON.stringify(document.components.schemas)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Schemas Needing Review
        From the complete schema set above, here are the SPECIFIC schemas that need review:

        \`\`\`json
        ${JSON.stringify(schema)}
        \`\`\`

        IMPORTANT: Only these ${Object.keys(schema).length} schemas 
        need review and potential modification. The other schemas in 
        the full set are provided for reference only.

        ## Operations
        Here are the API operations that utilize these specific schemas.
        They at least reference one of the schemas needing review in 
        their request or response bodies.

        Reference these operations to understand how the schemas are used:

        \`\`\`json
        ${JSON.stringify(operations)}
        \`\`\`
      `,
    },
  ];
};
