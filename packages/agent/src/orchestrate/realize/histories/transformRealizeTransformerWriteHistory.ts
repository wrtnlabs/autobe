import { AutoBeOpenApi, AutoBeRealizeTransformerPlan } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeRealizeTransformerProgrammer } from "../programmers/AutoBeRealizeTransformerProgrammer";

export const transformRealizeTransformerWriteHistory = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const dto: Record<string, string> =
    await AutoBeRealizeTransformerProgrammer.writeStructures(
      ctx,
      props.plan.dtoTypeName,
    );
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
          Here are the DTO types relevant with ${props.plan.dtoTypeName}:

          \`\`\`json
          ${JSON.stringify(dto)}
          \`\`\`
        `,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here is the declaration of the transformer function for
          the DTO type ${props.plan.dtoTypeName} and its corresponding
          Prisma schema ${props.plan.prismaSchemaName}:

          \`\`\`typescript
          ${AutoBeRealizeTransformerProgrammer.writeTemplate({
            plan: props.plan,
            schema: ctx.state().interface!.document.components.schemas[
              props.plan.dtoTypeName
            ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
          })}
          \`\`\`

          Here is the neighbor transformers you can utilize:

          Transformer Name | DTO Type Name | Prisam Schema Name 
          -----------------|---------------|--------------------
          ${props.neighbors
            .map((n) =>
              [
                AutoBeRealizeTransformerProgrammer.getName(n.dtoTypeName),
                n.dtoTypeName,
                n.prismaSchemaName,
              ].join(" | "),
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
