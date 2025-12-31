import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeRealizeTransformerProgrammer } from "../programmers/AutoBeRealizeTransformerProgrammer";

export const transformRealizeTransformerWriteHistory = async (
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const application: AutoBeDatabase.IApplication =
    ctx.state().database!.result.data;
  const model: AutoBeDatabase.IModel = application.files
    .map((f) => f.models)
    .flat()
    .find((m) => m.name === props.plan.databaseSchemaName)!;
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
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
          database schema ${props.plan.databaseSchemaName}:

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
                n.databaseSchemaName,
              ].join(" | "),
            )
            .join("\n")}

          Here is the list of database schema members you have to consider
          when writing select() function:

          Member | Kind | Nullable
          -------|------|----------
          ${AutoBeRealizeTransformerProgrammer.getSelectMappingMetadata({
            application,
            model,
          })
            .map((r) => `${r.member} | ${r.kind} | ${r.nullable}`)
            .join("\n")}

          Here is the list of property keys in the DTO type you have to
          consider when writing transform() function:

          ${AutoBeRealizeTransformerProgrammer.getTransformMappingMetadata({
            document,
            plan: props.plan,
          })
            .map((r) => `- ${r.property}`)
            .join("\n")}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a transformer module for the DTO type: ${props.plan.dtoTypeName}

      **Plan Information from REALIZE_TRANSFORMER_PLAN phase**:

      - **Database Schema Name**: ${props.plan.databaseSchemaName}
      - **Planning Reasoning**: ${props.plan.thinking}

      **Your task**:

      1. Use the provided database schema name: \`${props.plan.databaseSchemaName}\`
      2. Request database schemas to understand the table structure
      3. Request Interface schemas to understand the DTO structure
      4. Analyze field mappings between database columns and DTO properties
      5. Generate complete TypeScript code that includes:
         - A namespace with transform() and select() functions
         - Proper Prisma payload types
         - Type-safe field mappings from DB to DTO
         - Handling of nested relationships if needed

      Follow all coding standards and type safety rules. The database table name is already determined - use it directly.
    `,
  };
};
