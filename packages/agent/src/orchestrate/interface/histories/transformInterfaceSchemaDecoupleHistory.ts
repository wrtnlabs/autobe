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
  cycles: AutoBeInterfaceSchemaDecoupleCycle[];
}): IAutoBeOrchestrateHistory => ({
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
      text: buildCycleContext(props),
    },
  ],
  userMessage: StringUtil.trim`
    Resolve ${props.cycles.length} cross-type circular reference
    cycle(s) by choosing which property references to remove.

    Each cycle MUST have at least one of its edges removed.
    Remove the minimum number of edges needed to break ALL cycles.
  `,
});

const buildCycleContext = (props: {
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  cycles: AutoBeInterfaceSchemaDecoupleCycle[];
}): string => {
  const sections: string[] = [];

  sections.push("## Detected Circular Reference Cycles\n");
  sections.push(
    `Found **${props.cycles.length}** cross-type circular reference cycle(s).\n`,
  );

  for (let i = 0; i < props.cycles.length; i++) {
    const cycle = props.cycles[i]!;
    sections.push(
      `### Cycle ${i + 1}: ${cycle.types.join(" → ")} → ${cycle.types[0]}\n`,
    );
    sections.push("**Edges (each is a candidate for removal):**\n");
    for (const edge of cycle.edges)
      sections.push(
        `- \`${edge.sourceType}.${edge.propertyName}\` → \`${edge.targetType}\``,
      );
    sections.push("");
  }

  // Include schemas involved in cycles
  const involvedTypes = new Set<string>();
  for (const cycle of props.cycles)
    for (const type of cycle.types) involvedTypes.add(type);

  sections.push("## Schemas Involved in Cycles\n");
  for (const typeName of involvedTypes) {
    const schema = props.schemas[typeName];
    if (!schema || !AutoBeOpenApiTypeChecker.isObject(schema)) continue;

    sections.push(`### ${typeName}\n`);
    sections.push(`**Description**: ${schema.description}\n`);
    if (schema["x-autobe-specification"])
      sections.push(
        `**Specification**: ${schema["x-autobe-specification"]}\n`,
      );
    sections.push("**Properties:**\n");
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(propName) ? "required" : "optional";
      const kind = AutoBeOpenApiTypeChecker.getKind(propSchema);
      const desc =
        "description" in propSchema &&
        typeof propSchema.description === "string"
          ? ` — ${propSchema.description}`
          : "";
      sections.push(`- \`${propName}\` (${kind}, ${required})${desc}`);
    }
    sections.push("");
  }

  return sections.join("\n");
};
