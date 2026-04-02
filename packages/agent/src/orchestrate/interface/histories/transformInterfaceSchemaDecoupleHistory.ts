import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformInterfaceSchemaDecoupleHistory = (props: {
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  operations: AutoBeOpenApi.IOperation[];
  cycle: AutoBeInterfaceSchemaDecoupleCycle;
}): IAutoBeOrchestrateHistory => {
  // filter schemas
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const key of props.cycle.types)
    AutoBeOpenApiTypeChecker.visit({
      components: { schemas: props.schemas, authorizations: [] },
      schema: { $ref: `#/components/schemas/${key}` },
      closure: (next) => {
        if (AutoBeOpenApiTypeChecker.isReference(next) === false) return;
        const name: string = next.$ref.split("/").at(-1)!;
        const found: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
          props.schemas[name];
        if (found) schemas[name] = found;
      },
    });

  // filter operations
  const operations: AutoBeOpenApi.IOperation[] = [];
  for (const op of props.operations) {
    const predicate = (key: string): boolean => {
      let matched: boolean = false;
      AutoBeOpenApiTypeChecker.visit({
        components: { schemas: props.schemas, authorizations: [] },
        schema: { $ref: `#/components/schemas/${key}` },
        closure: (next) => {
          if (AutoBeOpenApiTypeChecker.isReference(next) === false) return;
          else if (schemas[next.$ref.split("/").at(-1)!] !== undefined)
            matched ||= true;
        },
      });
      return matched;
    };
    if (
      (op.requestBody && predicate(op.requestBody.typeName)) ||
      (op.responseBody && predicate(op.responseBody.typeName))
    )
      operations.push(op);
  }

  return {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_DECOUPLE,
      },
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Detected Circular Reference Cycle

          **Cycle**: ${props.cycle.types.join(" → ")} → ${props.cycle.types[0]}

          **Edges (candidates for removal):**

          ${props.cycle.edges
            .map(
              (e) =>
                `- \`${e.sourceType}.${e.propertyName}\` → \`${e.targetType}\``,
            )
            .join("\n")}

          ## Schemas Involved

          \`\`\`json
          ${JSON.stringify(schemas)}
          \`\`\`

          ## Operations Involved

          \`\`\`json
          ${JSON.stringify(operations)}
          \`\`\`
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Resolve this cross-type circular reference cycle by choosing
      exactly one property reference to remove.
    `,
  };
};
