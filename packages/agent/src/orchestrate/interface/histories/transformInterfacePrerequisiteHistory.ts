import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { getReferenceIds } from "../../test/utils/getReferenceIds";

// @todo -> RAG
export const transformInterfacePrerequisiteHistory = (props: {
  document: AutoBeOpenApi.IDocument;
  includes: AutoBeOpenApi.IOperation[];
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
}): IAutoBeOrchestrateHistory => {
  const domainSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    {};
  const visit = (key: string) =>
    OpenApiTypeChecker.visit({
      schema: {
        $ref: `#/components/schemas/${key}`,
      },
      components: props.document.components,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          domainSchemas[next.$ref.split("/").pop()!] =
            props.document.components.schemas[next.$ref.split("/").pop()!];
      },
    });
  for (const op of props.includes) {
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
      ...props.preliminary.createHistories(),
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Target Operations

          Operations requiring prerequisite analysis.

          For each of these operations, analyze if they need any prerequisites
          from the available operations above. Add prerequisites only when there
          are genuine dependencies like resource existence checks or state validations.

          \`\`\`json
          ${JSON.stringify(
            props.includes.map((op) => {
              return {
                ...op,
                requiredIds: getReferenceIds({
                  document: props.document,
                  operation: op,
                }),
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
