import { AutoBeRealizeCollectorFunction } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeCollectorProgrammer } from "../programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeCollectorCorrectHistory = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    function: AutoBeRealizeCollectorFunction;
    neighbors: AutoBeRealizeCollectorFunction[];
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[];
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): Promise<IAutoBeOrchestrateHistory> => {
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
          Here are the neighbor transformers relevant with ${props.function.plan.dtoTypeName}:

          \`\`\`json
          ${JSON.stringify(
            Object.fromEntries(
              props.neighbors.map((n) => [n.location, n.content]),
            ),
          )}
          \`\`\`
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

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${AutoBeRealizeCollectorProgrammer.writeTemplate(props.function.plan)}

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
