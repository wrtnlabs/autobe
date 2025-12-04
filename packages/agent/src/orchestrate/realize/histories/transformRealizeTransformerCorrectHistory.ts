import {
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeTransformerProgrammer } from "../programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeTransformerCorrectHistory = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    function: AutoBeRealizeTransformerFunction;
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[];
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
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_CORRECT,
        created_at: new Date().toISOString(),
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
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: StringUtil.trim`
      Correct the TypeScript transformer code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${AutoBeRealizeTransformerProgrammer.writeTemplate(props.plan)}

      Current code is as follows:

      \`\`\`typescript
      ${props.function.content}
      \`\`\`

      Remember: Transformers transform Prisma Payload → DTO. Focus on:
      - Field mapping between Prisma.${props.plan.prismaSchemaName}GetPayload and ${props.plan.dtoTypeName}
      - Date to ISO string conversion (.toISOString())
      - Nested object transformation using neighbor transformers
      - select() query completeness (all fields used in transform must be selected)
      - Null to undefined conversion when needed
      - Type safety with correct return type
    `,
  };
};
