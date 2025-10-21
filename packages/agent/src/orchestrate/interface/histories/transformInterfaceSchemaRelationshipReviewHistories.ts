import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaRelationshipReviewHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
  schemaDescriptive: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Read the INTERFACE_SCHEMA_RELATIONSHIP_REVIEW.md prompt
  const relationshipReviewPrompt = fs.readFileSync(
    path.join(__dirname, "../../../../prompts/INTERFACE_SCHEMA_RELATIONSHIP_REVIEW.md"),
    "utf-8",
  );

  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: relationshipReviewPrompt,
    },
    ...transformInterfaceAssetHistories(state),
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
        Here are the schemas that need relationship and structural review:

        \`\`\`json
        ${JSON.stringify(schemaDescriptive)}
        \`\`\`

        Please review these schemas for relationship and structure issues:
        1. Inline object types that should be extracted to named types with $ref
        2. Foreign key transformations (raw IDs vs object references)
        3. Relationship classifications (Composition vs Association vs Aggregation)
        4. Actor reversal violations (User.articles[], Seller.sales[])
        5. Missing IInvert types for alternative perspectives

        Fix ALL relationship and structural issues and return only the modified schemas in the content field.
      `,
    },
  ];
};