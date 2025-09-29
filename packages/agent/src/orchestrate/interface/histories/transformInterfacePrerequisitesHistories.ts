import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { getReferenceIds } from "../../test/utils/getReferenceIds";

export const transformInterfacePrerequisitesHistories = (
  document: AutoBeOpenApi.IDocument,
  include: AutoBeOpenApi.IOperation[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    document.components.schemas ?? {};

  const operations: AutoBeOpenApi.IOperation[] = document.operations.filter(
    (op) => op.authorizationType === null && op.method === "post",
  );

  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_PREREQUISITE,
    },
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        # Available API Operations
        
        All operations in this project for prerequisite references.
        These are the complete list of API endpoints that can be used as prerequisites.
        You should select appropriate operations from this list when establishing dependency chains.

        \`\`\`json
        ${JSON.stringify({
          operations: operations.map((op) => {
            return {
              ...op,
              prerequisites: undefined,
            };
          }),
        })}
        \`\`\`

        # Schema Definitions

        Data structure definitions to understand entity relationships.
        Use these schemas to identify parent-child relationships and data dependencies between operations.

        \`\`\`json
        ${JSON.stringify(schemas)}
        \`\`\`
            
        # Target Operations

        Operations requiring prerequisite analysis.
        For each of these operations, analyze if they need any prerequisites from the available operations above.
        Add prerequisites only when there are genuine dependencies like resource existence checks or state validations.

        \`\`\`json
        ${JSON.stringify(
          include.map((op) => {
            return {
              ...op,
              requiredIds: getReferenceIds({ document, operation: op }),
            };
          }),
        )}
        \`\`\`

      `,
    },
  ];
};
