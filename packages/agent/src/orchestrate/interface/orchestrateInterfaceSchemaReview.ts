import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaReviewEvent,
  // AutoBeInterfaceSchemaReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { AutoBeDatabaseModelProgrammer } from "../database/programmers/AutoBeDatabaseModelProgrammer";
import { transformInterfaceSchemaReviewHistory } from "./histories/transformInterfaceSchemaReviewHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaReview(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // Filter to only process object-type schemas (non-preset and object type)
  const typeNames: string[] = Object.entries(props.schemas)
    .filter(
      ([k, v]) =>
        AutoBeJsonSchemaValidator.isPreset(k) === false &&
        AutoBeOpenApiTypeChecker.isObject(v),
    )
    .map(([k]) => k);
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) =>
        key === it ||
        (AutoBeJsonSchemaValidator.isPage(key) &&
          AutoBeJsonSchemaFactory.getPageName(key) === it);
      const reviewOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );
      try {
        const value: AutoBeOpenApi.IJsonSchemaDescriptive = props.schemas[it];
        if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
          ++props.progress.completed;
          return;
        }
        const reviewed: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
          await process(ctx, {
            instruction: props.instruction,
            document: props.document,
            typeName: it,
            reviewOperations,
            reviewSchema: value,
            progress: props.progress,
            promptCacheKey,
          });
        x[it] = reviewed;
      } catch (error) {
        console.log("interfaceSchemaReview failure", it, error);
        --props.progress.total;
      }
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
    reviewOperations: AutoBeOpenApi.IOperation[];
    reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive.IObject> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );

  const schemaNames = [props.typeName];
  const opSummaries = props.reviewOperations
    .map((op) => `${op.method} ${op.path}: ${op.name}`)
    .join("\n");
  const queryText: string = `${schemaNames.join(", ")}\n${opSummaries}\n${props.instruction}`;

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "interfaceSchemaReview" },
    );

  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    application:
      typia.json.application<IAutoBeInterfaceSchemaReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "databaseSchemas",
      "previousDatabaseSchemas",
      "interfaceOperations",
      "previousInterfaceOperations",
      "interfaceSchemas",
      "previousInterfaceSchemas",
    ],
    config: {
      database: "text",
      databaseProperty: true,
    },
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      analysisSections: ragSections,
      interfaceOperations: props.reviewOperations,
      interfaceSchemas: { [props.typeName]: props.reviewSchema },
      databaseSchemas: (() => {
        const expected: string =
          props.reviewSchema["x-autobe-database-schema"] ??
          AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaName(props.typeName);
        const model: AutoBeDatabase.IModel | undefined = ctx
          .state()
          .database?.result.data.files.flatMap((f) => f.models)
          .find((m) => m.name === expected);
        if (model === undefined) return [];
        return AutoBeDatabaseModelProgrammer.getNeighbors({
          application: ctx.state().database!.result.data,
          model,
        });
      })(),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaReviewApplication.IWrite | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        schema: props.reviewSchema,
        preliminary,
        pointer,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaReviewHistory({
        state: ctx.state(),
        instruction: props.instruction,
        typeName: props.typeName,
        reviewOperations: props.reviewOperations,
        reviewSchema: props.reviewSchema,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Apply revises to generate the modified schema content
    const content: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
      AutoBeInterfaceSchemaReviewProgrammer.execute({
        schema: props.reviewSchema,
        revises: pointer.value.revises,
      });
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      typeName: props.typeName,
      schema: props.reviewSchema,
      review: pointer.value.review,
      excludes: pointer.value.excludes,
      revises: pointer.value.revises,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaReviewEvent);
    return out(result)(content);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    operations: AutoBeOpenApi.IOperation[];
    pointer: IPointer<
      IAutoBeInterfaceSchemaReviewApplication.IWrite | null | false
    >;
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
  },
): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaReviewApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceSchemaReviewProgrammer.validate({
      typeName: props.typeName,
      schema: props.schema,
      excludes: result.data.request.excludes,
      revises: result.data.request.revises,
      errors,
      path: `$input.request`,
      everyModels:
        ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [],
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  AutoBeInterfaceSchemaReviewProgrammer.fixApplication({
    everyModels:
      ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [],
    application,
    typeName: props.typeName,
    schema: props.schema,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaReviewApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps>;

const SOURCE = "interfaceSchemaReview" satisfies AutoBeEventSource;
