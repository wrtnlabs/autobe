import {
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeRealizeTransformerFunction,
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
    function: AutoBeRealizeTransformerFunction;
    neighbors: AutoBeRealizeTransformerFunction[];
    failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeTransformerFunction>[];
    preliminary: AutoBePreliminaryController<"prismaSchemas">;
  },
): Promise<IAutoBeOrchestrateHistory> => {
  const application: AutoBePrisma.IApplication =
    ctx.state().prisma!.result.data;
  const model: AutoBePrisma.IModel = application.files
    .map((f) => f.models)
    .flat()
    .find((m) => m.name === props.function.plan.prismaSchemaName)!;
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const dto: Record<string, string> =
    await AutoBeRealizeTransformerProgrammer.writeStructures(
      ctx,
      props.function.plan.dtoTypeName,
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

          Here is the list of Prisma schema members you have to consider
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
            plan: props.function.plan,
          })
            .map((r) => `- ${r.property}`)
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
      Correct the TypeScript transformer code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${AutoBeRealizeTransformerProgrammer.writeTemplate({
        plan: props.function.plan,
        schema: ctx.state().interface!.document.components.schemas[
          props.function.plan.dtoTypeName
        ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject,
      })}

      Current code is as follows:

      \`\`\`typescript
      ${props.function.content}
      \`\`\`

      Remember: Transformers transform Prisma Payload → DTO. Focus on:
      - Field mapping between Prisma.${props.function.plan.prismaSchemaName}GetPayload and ${props.function.plan.dtoTypeName}
      - Date to ISO string conversion (.toISOString())
      - Nested object transformation using neighbor transformers
      - select() query completeness (all fields used in transform must be selected)
      - Null to undefined conversion when needed
      - Type safety with correct return type
    `,
  };
};
