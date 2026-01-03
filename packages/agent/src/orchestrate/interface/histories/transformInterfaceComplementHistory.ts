import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { Escaper } from "typia/lib/utils/Escaper";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformInterfaceComplementHistory = (props: {
  instruction: string;
  document: AutoBeOpenApi.IDocument;
  typeName: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousInterfaceSchemas"
    | "previousInterfaceOperations"
    | "previousDatabaseSchemas"
  >;
}): IAutoBeOrchestrateHistory => ({
  histories: [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
    },
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_COMPLEMENT,
    },
    ...props.preliminary.getHistories(),
    ...[
      transformReferenceHistory({
        document: props.document,
        typeName: props.typeName,
      }),
    ].filter((r) => r !== null),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        Follow these instructions when completing missing schema types.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Missed Type

        You need to create a schema definition for this missing type:

        **${props.typeName}**

        This type is referenced in API operations but not yet defined in
        components.schemas. Create a complete JSON schema definition for it.
      `,
    },
  ],
  userMessage: StringUtil.trim`
    Complete the missing schema type ${JSON.stringify(props.typeName)} 
    based on the provided API design instructions.

    Note that, not making "Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>"
    type, but making "AutoBeOpenApi.IJsonSchemaDescriptive" type directly for
    the ${JSON.stringify(props.typeName)} type.
  `,
});

const transformReferenceHistory = (props: {
  document: AutoBeOpenApi.IDocument;
  typeName: string;
}): IMicroAgenticaHistoryJson | null => {
  const references: IReference[] = [];
  Object.entries(props.document.components.schemas).forEach(
    ([accessor, schema]) =>
      traverseReference({
        container: references,
        typeName: props.typeName,
        accessor,
        schema,
        description: schema.description,
      }),
  );
  if (references.length === 0) return null;
  return {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: StringUtil.trim`
      ## Existing Schema References

      The following schema definitions reference the missing type
      **${props.typeName}**. These references can provide context
      and insights into how the missing type is used within the API.

      \`\`\`json
      ${JSON.stringify(references)}
      \`\`\`
    `,
  };
};

const traverseReference = (props: {
  container: IReference[];
  typeName: string;
  accessor: string;
  schema: AutoBeOpenApi.IJsonSchema;
  description: string;
}): void => {
  if (
    AutoBeOpenApiTypeChecker.isReference(props.schema) &&
    props.schema.$ref.endsWith("/" + props.typeName)
  )
    props.container.push({
      accessor: props.accessor,
      description: props.description,
    });
  else if (AutoBeOpenApiTypeChecker.isOneOf(props.schema))
    props.schema.oneOf.forEach((next) =>
      traverseReference({
        ...props,
        schema: next,
      }),
    );
  else if (AutoBeOpenApiTypeChecker.isArray(props.schema))
    traverseReference({
      ...props,
      accessor: `${props.accessor}[]`,
      schema: props.schema.items,
    });
  else if (AutoBeOpenApiTypeChecker.isObject(props.schema)) {
    for (const [key, value] of Object.entries(props.schema.properties))
      traverseReference({
        ...props,
        accessor: Escaper.variable(key)
          ? `${props.accessor}`
          : `${props.accessor}[${JSON.stringify(key)}]`,
        schema: value,
      });
    if (
      typeof props.schema.additionalProperties === "object" &&
      props.schema.additionalProperties !== null
    )
      traverseReference({
        ...props,
        accessor: `${props.accessor}{}`,
        schema: props.schema.additionalProperties,
      });
  }
};

interface IReference {
  accessor: string;
  description: string;
}
