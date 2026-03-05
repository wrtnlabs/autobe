import { AutoBeDatabase, AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformInterfaceOperationParameterHistory } from "./transformInterfaceOperationParameterHistory";

export const transformInterfaceSchemaReviewHistory = (props: {
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
  reviewOperations: AutoBeOpenApi.IOperation[];
  reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
}): IAutoBeOrchestrateHistory => {
  const everyModels: AutoBeDatabase.IModel[] =
    props.state.database?.result.data.files.flatMap((f) => f.models) ?? [];
  const model: AutoBeDatabase.IModel | undefined = props.reviewSchema[
    "x-autobe-database-schema"
  ]
    ? everyModels.find(
        (m) => m.name === props.reviewSchema["x-autobe-database-schema"],
      )
    : undefined;

  return {
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
        text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_REVIEW,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        type: "assistantMessage",
        created_at: new Date().toISOString(),
        text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        relevant to the review task.

        Follow these instructions when reviewing and fixing schemas.
        Carefully distinguish between:

        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Operations (Filtered for Target Schema)

        Here are the API operations that directly use the schema under review.
        These operations reference the target schema "${props.typeName}" via
        requestBody.typeName or responseBody.typeName.

        This FILTERED list helps you understand the exact usage context for
        the schema you're reviewing:

        \`\`\`json
        ${JSON.stringify(props.reviewOperations)}
        \`\`\`

        ${transformInterfaceOperationParameterHistory({
          typeName: props.typeName,
          operations: props.reviewOperations,
        })}

        ## DTO type to review

        Here is the SPECIFIC schema that needs review for type "${props.typeName}":

        \`\`\`json
        ${JSON.stringify(props.reviewSchema)}
        \`\`\`

        Also, here is the list of properties currently defined in this schema,
        so you have to check them one by one:

        ${Object.keys(props.reviewSchema.properties)
          .map((k) => `- ${k}`)
          .join("\n")}

        ${transformDatabaseSchemaProperties({ everyModels, model })}

        IMPORTANT: Only this schema needs review and potential modification.
        Other schemas in the complete schema set are provided for reference
        only.
      `,
      },
    ],
    userMessage: StringUtil.trim`
    Review the JSON schema for ${JSON.stringify(props.typeName)} type.

    You MUST provide a revision for every single property in \`revises\`,
    and declare DB properties not in this DTO in \`excludes\`:
    ${Object.keys(props.reviewSchema.properties)
      .map((k) => `- ${k}`)
      .join("\n")}

    ${transformDatabaseSchemaProperties({ everyModels, model })}
  `,
  };
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

    Every DB property must be explicitly handled: either mapped to a DTO property
    in \`revises\`, or declared in \`excludes\` with a reason. Use these as
    \`databaseSchemaProperty\` values.

    **Columns** (scalar fields):
    ${columns.map((c) => `- \`${c}\``).join("\n")}

    **Belongs-to Relations** (FK → object):
    ${belongsTo.length > 0 ? belongsTo.map((r) => `- \`${r}\``).join("\n") : "- (none)"}

    **Has-many/Has-one Relations** (reverse side):
    ${hasRelations.length > 0 ? hasRelations.map((r) => `- \`${r}\``).join("\n") : "- (none)"}
  `;
}
