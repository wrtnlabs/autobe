import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { getReferenceIds } from "../../test/utils/getReferenceIds";

export const transformInterfacePrerequisitesHistories = (
  document: AutoBeOpenApi.IDocument,
  include: AutoBeOpenApi.IOperation[],
): IAutoBeOrchestrateHistory => {
  const domainSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    {};
  const visit = (key: string) =>
    OpenApiTypeChecker.visit({
      schema: {
        $ref: `#/components/schemas/${key}`,
      },
      components: document.components,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          domainSchemas[next.$ref.split("/").pop()!] =
            document.components.schemas[next.$ref.split("/").pop()!];
      },
    });
  for (const op of include) {
    if (op.requestBody) visit(op.requestBody.typeName);
    if (op.responseBody) visit(op.responseBody.typeName);
  }

  return {
    histories: [
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
          ## Document Overview

          ### Entire API Operations

          All operations in this project for prerequisite references.

          These are the complete list of API endpoints that can be used
          as prerequisites. You should select appropriate operations from
          this list when establishing dependency chains.

          \`\`\`json
          ${JSON.stringify({
            operations: document.operations
              .filter(
                (op) => op.authorizationType === null && op.method === "post",
              )
              .map((op) => {
                return {
                  ...op,
                  prerequisites: undefined,
                };
              }),
          })}
          \`\`\`

          ### Entire Schema Definitions

          Data structure definitions to understand entity relationships.

          Use these schemas to identify parent-child relationships and
          data dependencies between operations.

          \`\`\`json
          ${JSON.stringify({
            components: {
              schemas: document.components.schemas,
            },
          })}
          \`\`\`

          ## Target Operations and Schemas

          ### Target Operations

          Operations requiring prerequisite analysis.

          For each of these operations, analyze if they need any prerequisites
          from the available operations above. Add prerequisites only when there
          are genuine dependencies like resource existence checks or state validations.

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

          ### Domain Schemas

          Schema definitions for the target operations.

          \`\`\`json
          ${JSON.stringify(domainSchemas)}
          \`\`\`
        `,
      },
    ],
    userMessage: "Analyze and add operation prerequisites please",
  };
};
