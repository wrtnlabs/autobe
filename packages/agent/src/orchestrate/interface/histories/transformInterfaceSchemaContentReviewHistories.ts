import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaContentReviewHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
  schemaDescriptive: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Read the INTERFACE_SCHEMA_CONTENT_REVIEW.md prompt
  const contentReviewPrompt = fs.readFileSync(
    path.join(__dirname, "../../../../prompts/INTERFACE_SCHEMA_CONTENT_REVIEW.md"),
    "utf-8",
  );

  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: contentReviewPrompt,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        The Schema Agent and previous review agents have processed these API operations:

        \`\`\`json
        ${JSON.stringify(operations)}
        \`\`\`

        All schema types referenced in these operations must be complete and consistent.
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        Here are the schemas that need content completeness review:

        \`\`\`json
        ${JSON.stringify(schemaDescriptive)}
        \`\`\`

        Please review these schemas for content completeness and consistency:
        1. Field completeness against Prisma schema
        2. Data type accuracy (Prisma to OpenAPI mapping)
        3. Required field arrays matching Prisma nullability
        4. Description quality and comprehensiveness
        5. Consistency across DTO variants (IEntity, ICreate, IUpdate, ISummary)
        6. Missing variant detection

        Fix ALL content issues and return only the modified schemas in the content field.
      `,
    },
  ];
};