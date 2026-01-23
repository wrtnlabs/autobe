import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaRefineEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceSchemaRefineHistory } from "./histories/transformInterfaceSchemaRefineHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaRefineApplication } from "./structures/IAutoBeInterfaceSchemaRefineApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaRefine(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // Filter to only process non-object type schemas (potential degenerate primitives)
  const typeNames: string[] = Object.keys(props.schemas).filter(
    (k) =>
      props.schemas[k] !== undefined &&
      AutoBeJsonSchemaValidator.isPreset(k) === false &&
      AutoBeOpenApiTypeChecker.isObject(props.schemas[k]) === false,
  );
  props.progress.total += typeNames.length;

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) =>
        key === it ||
        (AutoBeJsonSchemaValidator.isPage(key) &&
          AutoBeJsonSchemaFactory.getPageName(key) === it);
      const refineOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );

      const originalSchema: AutoBeOpenApi.IJsonSchemaDescriptive =
        props.schemas[it];
      const refined: AutoBeOpenApi.IJsonSchemaDescriptive | null =
        await process(ctx, {
          instruction: props.instruction,
          document: props.document,
          typeName: it,
          refineOperations,
          originalSchema,
          progress: props.progress,
          promptCacheKey,
        });
      if (refined !== null) x[it] = refined;
    }),
  );
  return x;
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    refineOperations: AutoBeOpenApi.IOperation[];
    originalSchema: AutoBeOpenApi.IJsonSchemaDescriptive;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive | null> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaRefineApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "databaseSchemas",
      "previousDatabaseSchemas",
      "interfaceOperations",
      "previousInterfaceOperations",
      "interfaceSchemas",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.refineOperations,
      interfaceSchemas: { [props.typeName]: props.originalSchema },
      databaseSchemas:
        AutoBeInterfaceSchemaProgrammer.getNeighborDatabaseSchemas({
          typeName: props.typeName,
          application: ctx.state().database!.result.data,
        }),
    },
  });

  const value = await preliminary.orchestrate<
    AutoBeOpenApi.IJsonSchemaDescriptive.IObject | false
  >(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaRefineApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        schema: props.originalSchema,
        preliminary,
        pointer,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaRefineHistory({
        state: ctx.state(),
        instruction: props.instruction,
        typeName: props.typeName,
        refineOperations: props.refineOperations,
        originalSchema: props.originalSchema,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Fix schema if refined
    const refinedSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject | null =
      pointer.value.schema !== null
        ? (AutoBeJsonSchemaFactory.fixSchema(
            pointer.value.schema,
          ) as AutoBeOpenApi.IJsonSchemaDescriptive.IObject)
        : null;

    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      typeName: props.typeName,
      original: props.originalSchema,
      observation: pointer.value.observation,
      reasoning: pointer.value.reasoning,
      verdict: pointer.value.verdict,
      refined: refinedSchema,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaRefineEvent);

    return out(result)(refinedSchema ?? false);
  });
  return value || null;
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive;
    operations: AutoBeOpenApi.IOperation[];
    pointer: IPointer<IAutoBeInterfaceSchemaRefineApplication.IComplete | null>;
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
  },
): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaRefineApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Validate that schema is object type if provided
    if (
      result.data.request.schema !== null &&
      result.data.request.schema.type !== "object"
    ) {
      return {
        success: false,
        errors: [
          {
            path: "$input.request.schema.type",
            expected: '"object"',
            value: result.data.request.schema.type,
          },
        ],
        data: result.data,
      };
    }
    return result;
  };

  const everyModels: AutoBeDatabase.IModel[] =
    ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [];
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaRefineApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeInterfaceSchemaProgrammer.fixApplication({
    application,
    everyModels,
    model:
      everyModels.find(
        (m) =>
          m.name ===
          AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaName(props.typeName),
      ) ?? null,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaRefineApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaRefineApplication.IProps>;

const SOURCE = "interfaceSchemaRefine" satisfies AutoBeEventSource;
