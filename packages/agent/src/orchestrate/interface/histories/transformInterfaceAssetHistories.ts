import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBePrismaHistory,
  IAutoBePrismaCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";

export const transformInterfaceAssetHistories = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const analyze: AutoBeAnalyzeHistory = state.analyze!;
  const prisma: AutoBePrismaHistory = state.prisma!;
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Requirement analysis and Prisma DB schema generation are ready.

        Call the provided tool function to generate the OpenAPI document
        referencing below requirement analysis and Prisma DB schema.

        ## User Request

        ${analyze.reason}

        ## Requirement Analysis Report

        \`\`\`json
        ${JSON.stringify(analyze.files)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Database schema and entity relationship diagrams are ready.
        You should also look at this and consider logic including membership/login and token issuance.
        You can use table's name to define role in operations.

        ## Critical Schema Verification Instructions

        **IMPORTANT**: When generating API operations and descriptions:
        1. ONLY reference fields that ACTUALLY EXIST in the Prisma schema below
        2. NEVER assume common fields like \`deleted_at\`, \`created_by\`, \`updated_by\`, \`is_deleted\` exist
        3. For DELETE operations:
           - If schema HAS soft delete fields (e.g., \`deleted_at\`), describe soft delete behavior
           - If schema LACKS soft delete fields, describe hard delete behavior
        4. Verify EVERY field reference against the actual schema before including in descriptions

        ## Prisma DB Schema

        \`\`\`json
        ${JSON.stringify(prisma.schemas)}
        \`\`\`

        ## Entity Relationship Diagrams
        \`\`\`json
        ${JSON.stringify(
          (prisma.compiled as IAutoBePrismaCompileResult.ISuccess).diagrams,
        )}
        \`\`\`
      `,
    },
  ];
};
