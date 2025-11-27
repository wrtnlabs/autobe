import { AutoBeRealizeTransformerPlan } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeTransformerWriteHistories = (props: {
  state: AutoBeState;
  plan: AutoBeRealizeTransformerPlan;
  neighbors: AutoBeRealizeTransformerPlan[];
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here is the neighbor transformers you can utilize:

          Transformer Name | DTO Type Name | Prisam Schema Name 
          ---------------- | ------------- | -------------------
          ${props.neighbors
            .map(
              (n) =>
                `- ${n.dtoTypeName} | ${n.dtoTypeName} | ${n.prismaSchemaName}`,
            )
            .join("\n")}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a transformer module for the DTO type: ${props.plan.dtoTypeName}

      **Plan Information from REALIZE_TRANSFORMER_PLAN phase**:

      - **Prisma Schema Name**: ${props.plan.prismaSchemaName}
      - **Planning Reasoning**: ${props.plan.thinking}

      **Your task**:

      1. Use the provided Prisma schema name: \`${props.plan.prismaSchemaName}\`
      2. Request Prisma schemas to understand the table structure
      3. Request Interface schemas to understand the DTO structure
      4. Analyze field mappings between Prisma columns and DTO properties
      5. Generate complete TypeScript code that includes:
         - A namespace with transform() and select() functions
         - Proper Prisma payload types
         - Type-safe field mappings from DB to DTO
         - Handling of nested relationships if needed

      Follow all coding standards and type safety rules. The Prisma table name is already determined - use it directly.
    `,
  };
};
