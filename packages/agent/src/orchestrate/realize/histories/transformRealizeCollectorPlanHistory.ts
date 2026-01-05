import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeCollectorPlanHistory = (props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<
    "databaseSchemas" | "interfaceSchemas" | "interfaceOperations"
  >;
  dtoTypeName: string;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_COLLECTOR_PLAN,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          I understand the task.

          I need to analyze the given DTO type "${props.dtoTypeName}" and determine if it needs a collector.

          **My approach**:
          1. Request Interface schema to understand the DTO structure
          2. Request database schemas to find matching table
          3. Analyze the DTO to determine if it's collectable or not
          4. Generate a plan with ONE entry for this DTO

          **For collectable DTOs**: Set databaseSchemaName to actual database table name
          **For non-collectable DTOs**: Set databaseSchemaName to null

          I will return exactly ONE plan entry for the given DTO.
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Analyze the DTO type "${props.dtoTypeName}" and create a collector plan entry.

      **Your task**:
      1. Request Interface schema to understand the DTO structure
      2. Request database schema to find the matching table
      3. Determine if this DTO is collectable (maps to database table) or non-collectable
      4. Generate a plan with exactly ONE entry for this DTO

      **Remember**:
      - Your plan must contain exactly ONE entry for "${props.dtoTypeName}"
      - Collectable DTOs: Set databaseSchemaName to actual database table name
      - Non-collectable DTOs: Set databaseSchemaName to null
      - Do NOT include other DTOs in your plan

      Create the plan for this DTO now.
    `,
  };
};
