import {
  AutoBePrisma,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeCollectorProgrammer } from "../programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeCollectorCorrectHistory = async (
  ctx: AutoBeContext,
  props: {
    function: AutoBeRealizeCollectorFunction;
    neighbors: AutoBeRealizeCollectorFunction[];
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[];
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const application: AutoBePrisma.IApplication =
    ctx.state().prisma!.result.data;
  const model: AutoBePrisma.IModel = application.files
    .map((f) => f.models)
    .flat()
    .find((m) => m.name === props.function.plan.prismaSchemaName)!;
  const dto: Record<string, string> =
    await AutoBeRealizeCollectorProgrammer.writeStructures(
      ctx,
      props.function.plan.dtoTypeName,
    );
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_WRITE,
      },
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_CORRECT,
        created_at: new Date().toISOString(),
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here are the DTO types relevant with ${props.function.plan.dtoTypeName}:

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
          Here are the neighbor collectors relevant with ${props.function.plan.dtoTypeName}:

          \`\`\`json
          ${JSON.stringify(
            Object.fromEntries(
              props.neighbors.map((n) => [
                n.location,
                {
                  dtoTypeName: n.plan.dtoTypeName,
                  prismaSchemaName: n.plan.prismaSchemaName,
                  content: n.content,
                },
              ]),
            ),
          )}
          \`\`\`

          Also, this is the list of Prisma schema members you have to consider:

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
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: StringUtil.trim`
      Correct the TypeScript collector code implementation.

      The instruction to write at first was as follows, and the code you received is 
      the code you wrote according to this instruction. When modifying, modify the 
      entire code, but not the import statement.

      Below is template code you wrote:

      ${AutoBeRealizeCollectorProgrammer.writeTemplate({
        plan: props.function.plan,
        body: ctx.state().interface!.document.components.schemas[
          props.function.plan.dtoTypeName
        ],
        model,
        application,
      })}

      Current code is as follows:

      \`\`\`typescript
      ${props.function.content}
      \`\`\`

      Remember: Collectors transform DTO → Prisma CreateInput. Focus on:
      - Field mapping between ${props.function.plan.dtoTypeName} and Prisma.${props.function.plan.prismaSchemaName}CreateInput
      - UUID generation for primary keys
      - Foreign key connections using { connect: { id: ... } }
      - Timestamp fields (created_at, updated_at)
      - Type safety with satisfies clause
    `,
  };
};
