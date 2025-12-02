import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export function transformTestPrepareWriteHistories(props: {
  operation: AutoBeOpenApi.IOperation;
  schema: AutoBeOpenApi.IJsonSchema;
  instruction: string;
}): IAutoBeOrchestrateHistory {
  return {
    histories: [
      {
        id: v7(),
        type: "systemMessage",
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.TEST_PREPARE_WRITE,
      },
      {
        id: v7(),
        type: "assistantMessage",
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Domain Context
          
          ${props.instruction}
          
          ## Target Operation
          
          - **Method**: ${props.operation.method.toUpperCase()}
          - **Path**: ${props.operation.path}
          - **DTO Type**: ${props.operation.requestBody?.typeName ?? "Unknown"}
          
          ## Schema Analysis
          
          You must analyze the following schema to generate a prepare function for the DTO type: **${props.operation.requestBody?.typeName}**
          
          The schema structure is:
          \`\`\`json
          ${JSON.stringify(props.schema, null, 2)}
          \`\`\`
          
          ## Required Actions
          
          1. **Classify Properties**: Separate user-controllable fields from system-managed fields
          2. **Create Pick Type**: Use Pick<${props.operation.requestBody?.typeName}, "field1" | "field2" | ...> for input parameter
          3. **Generate Data**: Use RandomGenerator utilities to create realistic test data
          4. **Respect Constraints**: Follow all validation rules from the schema
          `,
      },
    ],
    userMessage: "Generate the test data preparation function for this DTO.",
  };
}
