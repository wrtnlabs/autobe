import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBeCyclinicController } from "../../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeRealizeTransformerPlanApplication } from "../structures/IAutoBeRealizeTransformerPlanApplication";

export const transformRealizeTransformerPlanHistory = (props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<
    "analysisSections" | "databaseSchemas" | "interfaceSchemas"
  >;
  dtoTypeName: string;
  previousWrite: IAutoBeRealizeTransformerPlanApplication.IWrite | null;
  failures: AutoBeCyclinicController.IFailure[];
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_TRANSFORMER_PLAN,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to analyze the given DTO type "${props.dtoTypeName}" and determine if it needs a transformer.

          **My approach**:
          1. Analyze the DTO to determine if it's transformable or not
          2. Generate a plan with ONE entry for this DTO

          **For transformable DTOs**: Set databaseSchemaName to actual database table name
          **For non-transformable DTOs**: Set databaseSchemaName to null

          I will return exactly ONE plan entry for the given DTO.
        `,
      },
      ...(props.previousWrite !== null
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage" as const,
              text: StringUtil.trim`
                Previously submitted plan (your last write):

                \`\`\`json
                ${JSON.stringify(props.previousWrite.plans, null, 2)}
                \`\`\`

                ${
                  props.failures.length > 0
                    ? StringUtil.trim`
                        Validation errors from that submission:

                        \`\`\`json
                        ${JSON.stringify(
                          props.failures
                            .map((f) => f.diagnostics as IValidation.IError[])
                            .flat(),
                          null,
                          2,
                        )}
                        \`\`\`

                        Please fix these errors and submit a corrected plan via \`write\`, then
                        call \`complete\` to finalize.
                      `
                    : "You may revise this plan by submitting another write, or call complete if it is correct."
                }
              `,
            },
          ]
        : []),
    ],
    userMessage: StringUtil.trim`
      Analyze the DTO type "${props.dtoTypeName}" and create a transformer plan entry.

      **Your task**:
      1. Determine if this DTO is transformable (maps to database table) or non-transformable
      2. Generate a plan with exactly ONE entry for this DTO

      **Remember**:
      - Your plan must contain exactly ONE entry for "${props.dtoTypeName}"
      - Transformable DTOs: Set databaseSchemaName to actual database table name
      - Non-transformable DTOs: Set databaseSchemaName to null
      - Do NOT include other DTOs in your plan

      Create the plan for this DTO now.
    `,
  };
};
