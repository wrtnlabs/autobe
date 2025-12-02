import { AutoBeOpenApi, AutoBeRealizeTransformerPlan } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeRealizeTransformerProgrammer } from "../programmers/AutoBeRealizeTransformerProgrammer";

export const transformRealizeTransformerWriteHistories = (props: {
  document: AutoBeOpenApi.IDocument;
  plan: AutoBeRealizeTransformerPlan;
  neighbors: AutoBeRealizeTransformerPlan[];
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): IAutoBeOrchestrateHistory => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = {};
  AutoBeOpenApiTypeChecker.visit({
    components: props.document.components,
    closure: (next: AutoBeOpenApi.IJsonSchema) => {
      if (AutoBeOpenApiTypeChecker.isReference(next)) {
        const key: string = next.$ref.split("/").pop()!;
        schemas[key] ??= props.document.components.schemas[key];
      }
    },
    schema: { $ref: `#/components/schemas/${props.plan.dtoTypeName}` },
  });
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
          Here are the relevant schemas for the DTO type ${props.plan.dtoTypeName}:

          \`\`\`json
          ${JSON.stringify(schemas)}
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
          ${AutoBeRealizeTransformerProgrammer.getTemplate(props.plan)}
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
