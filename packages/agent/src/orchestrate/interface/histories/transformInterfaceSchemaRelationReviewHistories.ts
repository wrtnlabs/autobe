import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaRelationReviewHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
  schemaDescriptive: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
    },
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        The Schema Agent has generated schemas for the following API operations.
        These operations define what endpoints exist and what request/response types they use:

        \`\`\`json
        ${JSON.stringify(operations)}
        \`\`\`

        All schema types referenced in these operations (in requestBody and responses) must exist in the schemas.
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        Here are the schemas that need relation and structural review:

        \`\`\`json
        ${JSON.stringify(schemaDescriptive)}
        \`\`\`

        Please review these schemas for relation and structure issues:
        1. Inline object types that should be extracted to named types with $ref
        2. Foreign key transformations (raw IDs vs object references)
        3. Relation classifications (Composition vs Association vs Aggregation)
        4. Actor reversal violations (User.articles[], Seller.sales[])
        5. Missing IInvert types for alternative perspectives

        Fix ALL relation and structural issues and return only the modified schemas in the content field.
      `,
    },
  ];
};
