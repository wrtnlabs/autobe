import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { IAutoBePreliminaryCollection } from "../../common/structures/IAutoBePreliminaryCollection";

export const transformInterfaceAssetHistories = (
  preliminary: IAutoBePreliminaryCollection,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Requirement analysis and Prisma DB schema generation are ready.

        Call the provided tool function to generate the OpenAPI document
        referencing below requirement analysis and Prisma DB schema.

        ## Requirement Analysis Report

        \`\`\`json
        ${JSON.stringify(preliminary.analyzeFiles)}
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

        ## Prisma DB Schema

        \`\`\`json
        ${JSON.stringify(preliminary.prismaSchemas)}
        \`\`\`
      `,
    },
  ];
};
