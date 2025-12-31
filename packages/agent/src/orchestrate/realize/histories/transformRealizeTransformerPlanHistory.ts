import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeTransformerPlanHistory = (props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas"
  >;
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

          I need to analyze ALL DTOs from the operation response and create a complete plan that determines which transformers to generate.

          **My approach**:
          1. Extract all candidate DTOs from operation response (including nested DTOs)
          2. Request database schemas to understand database structure
          3. Request Interface schemas to understand DTO shapes
          4. Analyze each DTO to determine if it's transformable or not
          5. Generate complete plan including ALL DTOs with appropriate databaseSchemaName

          **For transformable DTOs**: Set databaseSchemaName to actual database table name
          **For non-transformable DTOs**: Set databaseSchemaName to null

          I will include ALL DTOs in the plan with their analysis results.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Analyze the operation response DTOs and create a complete transformer plan.

      **Your task**:
      1. Identify ALL DTO types from the operation response (including nested DTOs)
      2. Request necessary database schemas and Interface schemas to understand mappings
      3. Determine which DTOs are transformable (map to database tables) vs non-transformable
      4. Generate complete plan including ALL DTOs

      **Remember**:
      - Include ALL DTOs in your plan (both transformable and non-transformable)
      - Transformable DTOs: Set databaseSchemaName to actual database table name
      - Non-transformable DTOs: Set databaseSchemaName to null
      - Analyze nested DTOs recursively (category, tags, etc.)

      Create the complete plan now.
    `,
  };
};
