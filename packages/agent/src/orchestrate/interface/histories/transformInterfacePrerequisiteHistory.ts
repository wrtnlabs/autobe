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
  operation: AutoBeOpenApi.IOperation;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
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
  if (props.operation.requestBody) visit(props.operation.requestBody.typeName);
  if (props.operation.responseBody)
    visit(props.operation.responseBody.typeName);

  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_PREREQUISITE,
      },
      ...props.preliminary.getHistories(),
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Target Operation

          Single operation requiring prerequisite analysis.

          Analyze if this operation needs any prerequisites from the available
          operations above. Add prerequisites only when there are genuine
          dependencies like resource existence checks or state validations.

          \`\`\`json
          ${JSON.stringify(props.operation)}
          \`\`\`

          Also, here is the list of reference IDs found in the target 
          operation's path parameters.

          ${
            getReferenceIds({
              document: props.document,
              operation: props.operation,
            })
              .map((id) => `- ${id}`)
              .join("\n") || "- None"
          }

          ### Domain Schemas

          Schema definitions for the target operation.

          \`\`\`json
          ${JSON.stringify(domainSchemas)}
          \`\`\`
        `,
      },
    ],
    userMessage: "Analyze and add operation prerequisites please",
  };
};
