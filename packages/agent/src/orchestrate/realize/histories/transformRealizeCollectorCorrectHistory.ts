import {
  AutoBeOpenApi,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeCollectorProgrammer } from "../programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export function transformRealizeCollectorCorrectHistory(props: {
  plan: AutoBeRealizeCollectorPlan;
  function: AutoBeRealizeCollectorFunction;
  document: AutoBeOpenApi.IDocument;
  failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeCollectorFunction>[];
  preliminary: AutoBePreliminaryController<"prismaSchemas">;
}): IAutoBeOrchestrateHistory {
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
          Here are the relevant schemas for the DTO type ${props.plan.dtoTypeName}:

          \`\`\`json
          ${JSON.stringify(schemas)}
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

      ${AutoBeRealizeCollectorProgrammer.writeTemplate(props.plan)}

      Current code is as follows:

      \`\`\`typescript
      ${props.function.content}
      \`\`\`

      Remember: Collectors transform DTO → Prisma CreateInput. Focus on:
      - Field mapping between ${props.plan.dtoTypeName} and Prisma.${props.plan.prismaSchemaName}CreateInput
      - UUID generation for primary keys
      - Foreign key connections using { connect: { id: ... } }
      - Timestamp fields (created_at, updated_at)
      - Type safety with satisfies clause
    `,
  };
}
