import { AutoBeDatabase, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformInterfaceOperationParameterHistory } from "./transformInterfaceOperationParameterHistory";

export const transformInterfaceSchemaRefineHistory = (props: {
  state: AutoBeState;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  >;
  typeName: string;
  operations: AutoBeOpenApi.IOperation[];
  schema: AutoBeOpenApi.IJsonSchema.IObject;
}): IAutoBeOrchestrateHistory => {
  const everyModels: AutoBeDatabase.IModel[] =
    props.state.database?.result.data.files.flatMap((f) => f.models) ?? [];
  const model: AutoBeDatabase.IModel | undefined = props.schema[
    "x-autobe-database-schema"
  ]
    ? everyModels.find(
        (m) => m.name === props.schema["x-autobe-database-schema"],
      )
    : undefined;

  const result: IAutoBeOrchestrateHistory = {
    histories: [
      {
        type: "systemMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REFINE,
      },
      ...props.preliminary.getHistories(),
      {
        type: "assistantMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        relevant to the refinement task.

        Follow these instructions when enriching schemas with documentation
        and metadata.
        Carefully distinguish between:

        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}
      `,
      },
      {
        id: v7(),
        type: "assistantMessage",
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
          ## Operations (Filtered for Target Schema)

          Here are the API operations that directly use the schema to refine.
          These operations reference the target schema "${props.typeName}" via
          requestBody.typeName or responseBody.typeName.

          This FILTERED list helps you understand the exact usage context for
          the schema you're enriching:

          \`\`\`json
          ${JSON.stringify(props.operations)}
          \`\`\`

          ${transformInterfaceOperationParameterHistory({
            typeName: props.typeName,
            operations: props.operations,
          })}

          ## DTO type to refine

          Here is the SPECIFIC schema that needs refinement for type "${props.typeName}":

          \`\`\`json
          ${JSON.stringify(props.schema)}
          \`\`\`

          Also, here is the list of properties currently defined in this schema,
          so you have to enrich them one by one. Note that, only this schema needs
          refinement. Other schemas in the complete schema set are provided for
          reference only.

          ${Object.keys(props.schema.properties)
            .map((k) => `- ${k}`)
            .join("\n")}

          ${transformDatabaseSchemaProperties({
            everyModels,
            model,
          })}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Refine ${JSON.stringify(props.typeName)} schema by enriching each property
      with \`databaseSchemaProperty\`, \`specification\`, and \`description\`.

      **Object-level**: \`databaseSchema\` (nullable), \`specification\` (MANDATORY),
      \`description\` (MANDATORY).

      **Property-level**: Use \`depict\`, \`create\`, \`update\`, or \`erase\` for each
      property in \`revises\`. DB properties not in this DTO go in \`excludes\`.

      When \`databaseSchemaProperty\` or \`databaseSchema\` is \`null\`, the
      \`specification\` becomes the ONLY source of truth for downstream agents.

      You MUST provide a refinement for every single property without exception:
      
      ${Object.keys(props.schema.properties)
        .map((k) => `- ${k}`)
        .join("\n")}

      ${transformDatabaseSchemaProperties({
        everyModels,
        model,
      })}
    `,
  };
  return result;
};

function transformDatabaseSchemaProperties(props: {
  everyModels: AutoBeDatabase.IModel[];
  model: AutoBeDatabase.IModel | undefined;
}): string {
  if (props.model === undefined) return "";

  // Columns: primary key, plain fields, FK columns
  const columns: string[] = [
    props.model.primaryField.name,
    ...props.model.plainFields.map((f) => f.name),
    ...props.model.foreignFields.map((f) => f.name),
  ];

  // Belongs-to relations (from FK)
  const belongsTo: string[] = props.model.foreignFields.map(
    (f) => f.relation.name,
  );

  // Has-many/has-one relations (opposite side)
  const hasRelations: string[] = props.everyModels
    .flatMap((m) =>
      m.foreignFields
        .filter((f) => f.relation.targetModel === props.model!.name)
        .map((f) => f.relation.oppositeName),
    )
    .filter((name): name is string => name !== undefined);

  return StringUtil.trim`
    ## Database Schema Properties for \`${props.model.name}\`

    If you keep \`databaseSchema\` as \`${JSON.stringify(props.model.name)}\`,
    every DB property below must be explicitly handled: either mapped to a DTO
    property in \`revises\`, or declared in \`excludes\` with a reason.

    **Columns** (scalar fields):
    ${columns.map((c) => `- \`${c}\``).join("\n")}

    **Belongs-to Relations** (FK → object):
    ${belongsTo.length > 0 ? belongsTo.map((r) => `- \`${r}\``).join("\n") : "- (none)"}

    **Has-many/Has-one Relations** (reverse side):
    ${hasRelations.length > 0 ? hasRelations.map((r) => `- \`${r}\``).join("\n") : "- (none)"}
  `;
}
