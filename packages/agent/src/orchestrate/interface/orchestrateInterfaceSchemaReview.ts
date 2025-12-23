import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { LocalEmbeddingProvider } from "../../utils/LocalEmbeddingProvider";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { retrieveRelevantAnalysisFiles } from "../../utils/vectorDB";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { AutoBeDatabaseModelProgrammer } from "../prisma/programmers/AutoBeDatabaseModelProgrammer";
import { transformInterfaceSchemaReviewHistory } from "./histories/transformInterfaceSchemaReviewHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";
import { IAutoBeInterfaceSchemaReviewConfig } from "./structures/IAutoBeInterfaceSchemaReviewConfig";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

interface IConfig {
  kind: AutoBeInterfaceSchemaReviewEvent["kind"];
  systemPrompt: string;
}

let _embedder: LocalEmbeddingProvider | null = null;
function getEmbedder(): LocalEmbeddingProvider {
  if (!_embedder) {
    _embedder = new LocalEmbeddingProvider({
      modelIdOrPath: "Xenova/all-MiniLM-L6-v2",
      quantized: true,
      batchSize: 32,
      enableCache: true,
    });
  }
  return _embedder;
}

export async function orchestrateInterfaceSchemaReview<
  Revise extends AutoBeInterfaceSchemaPropertyRevise,
>(
  ctx: AutoBeContext,
  config: IAutoBeInterfaceSchemaReviewConfig<Revise>,
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
        AutoBeOpenApiTypeChecker.isObject(v) &&
        Object.keys(v.properties).length !== 0,
    )
    .map(([k]) => k)
    .filter(
      (typeName) =>
        config.kind !== "security" ||
        AutoBeInterfaceSchemaReviewProgrammer.filterSecurity({
          document: props.document,
          typeName,
        }),
    );
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
          await process(ctx, config, {
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

async function process<Revise extends AutoBeInterfaceSchemaPropertyRevise>(
  ctx: AutoBeContext,
  config: IAutoBeInterfaceSchemaReviewConfig<Revise>,
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
  const analyzeFiles = ctx.state().analyze?.files ?? [];
  const previousAnalyzeFiles = ctx.state().previousAnalyze?.files ?? [];
  const allAnalyzeFiles = [...analyzeFiles, ...previousAnalyzeFiles];

  const schemaNames = [props.typeName];
  const opSummaries = props.reviewOperations
    .map((op) => `${op.method} ${op.path}: ${op.name}`)
    .join("\n");
  const queryText = `${schemaNames.join(", ")}\n${opSummaries}\n${props.instruction}`;

  const allRagResults = await retrieveRelevantAnalysisFiles(
    getEmbedder(),
    allAnalyzeFiles,
    queryText,
  );

  const currentFilenames = new Set(analyzeFiles.map((f) => f.filename));
  const ragAnalysisFiles = allRagResults.filter((f) =>
    currentFilenames.has(f.filename as `${string}.md`),
  );
  const ragPreviousAnalysisFiles = allRagResults.filter(
    (f) => !currentFilenames.has(f.filename as `${string}.md`),
  );

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
    application: config.jsonSchema(),
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
      analysisFiles: ragAnalysisFiles,
      previousAnalysisFiles: ragPreviousAnalysisFiles,
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
    const pointer: IPointer<IAutoBeInterfaceSchemaReviewApplication.IComplete<Revise> | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, config, {
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
        systemPrompt: config.systemPrompt,
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
      kind: config.kind,
      id: v7(),
      typeName: props.typeName,
      schema: props.reviewSchema,
      review: pointer.value.review,
      revises: pointer.value.revises,
      acquisition: preliminary.getAcquisition(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    });
    return out(result)(content);
  });
}

function createController<Revise extends AutoBeInterfaceSchemaPropertyRevise>(
  ctx: AutoBeContext,
  config: IAutoBeInterfaceSchemaReviewConfig<Revise>,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    operations: AutoBeOpenApi.IOperation[];
    pointer: IPointer<
      IAutoBeInterfaceSchemaReviewApplication.IComplete<Revise> | null | false
    >;
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
  const validate: Validator<Revise> = (next) => {
    const result: IValidation<
      IAutoBeInterfaceSchemaReviewApplication.IProps<Revise>
    > = config.validate(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceSchemaReviewProgrammer.validate({
      typeName: props.typeName,
      schema: props.schema,
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
    config.application(validate),
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
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaReviewApplication<Revise>,
  };
}

type Validator<Revise extends AutoBeInterfaceSchemaPropertyRevise> = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps<Revise>>;

const SOURCE = "interfaceSchemaReview" satisfies AutoBeEventSource;
