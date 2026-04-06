import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { AutoBeRealizeOperationProgrammer } from "../programmers/AutoBeRealizeOperationProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "../programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { transformRealizeOperationWriteHistory } from "./transformRealizeOperationWriteHistory";

export function transformRealizeOperationCorrectHistory(props: {
  state: AutoBeState;
  authorizations: AutoBeRealizeAuthorization[];
  collectors: AutoBeRealizeCollectorFunction[];
  transformers: AutoBeRealizeTransformerFunction[];
  function: AutoBeRealizeOperationFunction;
  dto: Record<string, string>;
  failures: IAutoBeRealizeFunctionFailure<AutoBeRealizeOperationFunction>[];
  preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "realizeCollectors"
    | "realizeTransformers"
  >;
}): IAutoBeOrchestrateHistory {
  const document: AutoBeOpenApi.IDocument = props.state.interface!.document;
  const operation: AutoBeOpenApi.IOperation = document.operations.find(
    (o) =>
      o.method === props.function.endpoint.method &&
      o.path === props.function.endpoint.path,
  )!;
  const scenario: IAutoBeRealizeScenarioResult =
    AutoBeRealizeOperationProgrammer.getScenario({
      authorizations: props.authorizations,
      operation,
    });
  const application: AutoBeDatabase.IApplication =
    props.state.database!.result.data;
  const writeHistories: IAutoBeOrchestrateHistory =
    transformRealizeOperationWriteHistory({
      state: props.state,
      scenario,
      authorization: scenario.decoratorEvent ?? null,
      totalAuthorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      dto: props.dto,
      preliminary: props.preliminary,
    });

  // Extract referenced models from the failing code and show schema
  const schemaReference = buildSchemaReferenceForCode({
    code: props.function.content,
    application,
  });

  return {
    histories: [
      ...writeHistories.histories,
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
      },
      {
        id: v7(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_OPERATION_CORRECT,
        created_at: new Date().toISOString(),
      },
      ...(schemaReference
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage" as const,
              text: schemaReference,
            },
          ]
        : []),
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: StringUtil.trim`
      Correct the TypeScript code implementation.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${AutoBeRealizeOperationProgrammer.writeTemplate({
        authorizations: props.authorizations,
        operation,
        schemas: props.state.interface!.document.components.schemas,
        collectors: props.collectors,
        transformers: props.transformers,
      })}

      Current code is as follows:
      \`\`\`typescript
      ${props.function.content}
      \`\`\`
    `,
  };
}

/**
 * Extracts Prisma model names from operation code (`prisma.model_name.`) and
 * builds a schema reference showing valid columns and relations.
 */
function buildSchemaReferenceForCode(props: {
  code: string;
  application: AutoBeDatabase.IApplication;
}): string | null {
  // Extract model names from prisma.xxx.findMany/create/update/etc patterns
  const PRISMA_MODEL = /prisma\.(\w+)\.\w+/g;
  const modelNames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PRISMA_MODEL.exec(props.code)) !== null) {
    modelNames.add(match[1]!);
  }

  if (modelNames.size === 0) return null;

  // Build lookup
  const modelsByName = new Map<string, AutoBeDatabase.IModel>();
  for (const file of props.application.files) {
    for (const model of file.models) {
      modelsByName.set(model.name, model);
    }
  }

  const sections: string[] = [];
  for (const name of modelNames) {
    const model = modelsByName.get(name);
    if (!model) continue;

    const relationTable =
      AutoBeRealizeTransformerProgrammer.formatRelationMappingTable({
        application: props.application,
        model,
      });
    const selectMetadata =
      AutoBeRealizeTransformerProgrammer.getSelectMappingMetadata({
        application: props.application,
        model,
      });

    sections.push(
      StringUtil.trim`
        ### Model: \`${name}\`

        **Scalar & FK columns** (use these exact names in select/where/create):

        Member | Kind | Nullable
        -------|------|----------
        ${selectMetadata.map((r) => `${r.member} | ${r.kind} | ${r.nullable}`).join("\n")}

        **Relation Mapping Table** (use propertyKey for includes/select, NEVER guess):

        ${relationTable}
      `,
    );
  }

  if (sections.length === 0) return null;

  return StringUtil.trim`
    # Database Schema Reference for Correction

    IMPORTANT: Use ONLY the column names and relation property keys listed below.
    Do NOT guess or derive names from table names — use the exact propertyKey values.

    ${sections.join("\n\n")}
  `;
}
