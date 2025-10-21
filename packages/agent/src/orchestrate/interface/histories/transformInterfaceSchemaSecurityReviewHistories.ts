import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaSecurityReviewHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
  schemaDescriptive: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Read the INTERFACE_SCHEMA_SECURITY_REVIEW.md prompt
  const securityReviewPrompt = fs.readFileSync(
    path.join(__dirname, "../../../../prompts/INTERFACE_SCHEMA_SECURITY_REVIEW.md"),
    "utf-8",
  );

  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: securityReviewPrompt,
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
        Here are the schemas that need security review:

        \`\`\`json
        ${JSON.stringify(schemaDescriptive)}
        \`\`\`

        Please review these schemas specifically for security compliance:
        1. Authentication context fields in request DTOs (bbs_member_id, session_id, etc.)
        2. Password and token exposure in response DTOs
        3. System-managed fields in request DTOs
        4. Phantom fields that don't exist in Prisma schema

        Remove ALL security violations and return only the modified schemas in the content field.
      `,
    },
  ];
};