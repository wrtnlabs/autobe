import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { AutoBeRealizeCollectorProgrammer } from "../programmers/AutoBeRealizeCollectorProgrammer";

export const transformRealizeCollectorWriteHistory = async (
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeCollectorPlan;
    preliminary: AutoBePreliminaryController<"databaseSchemas">;
    neighbors: AutoBeRealizeCollectorPlan[];
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const application: AutoBeDatabase.IApplication =
    ctx.state().database!.result.data;
  const model: AutoBeDatabase.IModel = application.files
    .map((f) => f.models)
    .flat()
    .find((m) => m.name === props.plan.databaseSchemaName)!;
  const dto: Record<string, string> =
    await AutoBeRealizeCollectorProgrammer.writeStructures(
      ctx,
      props.plan.dtoTypeName,
    );
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_WRITE,
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
          ${getDeclaration({
            plan: props.plan,
            body: ctx.state().interface!.document.components.schemas[
              props.plan.dtoTypeName
            ],
            model,
            application,
          })}

          Here are the neighbor collectors you can utilize.

          You can call their functions by using the function property of below.

          \`\`\`json
          ${JSON.stringify(
            props.neighbors.map((n) => ({
              function: `${AutoBeRealizeCollectorProgrammer.getName(n.dtoTypeName)}.collect()`,
              dtoTypeName: n.dtoTypeName,
              databaseSchemaName: n.databaseSchemaName,
              references: n.references,
            })),
          )}
          \`\`\`

          At last, here is the list of database schema members you have to consider:

          Member | Kind | Nullable
          -------|------|----------
          ${AutoBeRealizeCollectorProgrammer.getMappingMetadata({
            application,
            model,
          })
            .map((r) => `${r.member} | ${r.kind} | ${r.nullable}`)
            .join("\n")}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Create a collector module for the DTO type: ${props.plan.dtoTypeName}

      **Plan Information from REALIZE_COLLECTOR_PLAN phase**:

      - **Database Schema Name**: ${props.plan.databaseSchemaName}
      - **Planning Reasoning**: ${props.plan.thinking}

      **Your task**:

      1. Use the provided database schema name: \`${props.plan.databaseSchemaName}\`
      2. Request database schemas to understand the table structure
      3. Request Interface schemas to understand the DTO structure
      4. Analyze field mappings between DTO properties and database columns
      5. Generate complete TypeScript code that includes:
         - A namespace with collect() function
         - Proper Prisma CreateInput types
         - Type-safe field mappings from DTO to DB
         - Handling of nested relationships if needed
         - UUID generation for new records

      Follow all coding standards and type safety rules. The database table name is already determined - use it directly.
    `,
  };
};

function getDeclaration(props: {
  plan: AutoBeRealizeCollectorPlan;
  body: AutoBeOpenApi.IJsonSchema;
  model: AutoBeDatabase.IModel;
  application: AutoBeDatabase.IApplication;
}): string {
  return StringUtil.trim`
    Here is the declaration of the collector function for
    the DTO type ${props.plan.dtoTypeName} and its corresponding
    database schema ${props.plan.databaseSchemaName}.

    ${
      props.plan.references.length === 0
        ? ""
        : StringUtil.trim`
          Also, as create DTO ${props.plan.dtoTypeName} does not include
          every references required for the creation of the ${props.plan.databaseSchemaName}
          record, you have to accept some references as function
          parameters like below:
        `
    }

    \`\`\`typescript
    ${AutoBeRealizeCollectorProgrammer.writeTemplate(props)}
    \`\`\`
  `;
}
