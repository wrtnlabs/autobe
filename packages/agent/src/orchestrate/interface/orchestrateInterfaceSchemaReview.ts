import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { AutoBeDatabaseModelProgrammer } from "../prisma/programmers/AutoBeDatabaseModelProgrammer";
import { transformInterfaceSchemaReviewHistory } from "./histories/transformInterfaceSchemaReviewHistory";
import { AutoBeInterfaceSchemaProgrammer } from "./programmers/AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaReviewProgrammer } from "./programmers/AutoBeInterfaceSchemaReviewProgrammer";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

const MAX_WRITE_ATTEMPTS = 3;

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

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "interfaceOperations"
  | "interfaceSchemas"
  | "previousAnalysisSections"
  | "previousDatabaseSchemas"
  | "previousInterfaceOperations"
  | "previousInterfaceSchemas";

interface IWriteFailure {
  errors: IValidation.IError[];
  iteration: number;
}

// ── Main loop ──

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

  const preliminary = new AutoBePreliminaryController<PreliminaryKinds>({
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

  // Write-validate-correct loop state
  let lastWrite: IAutoBeInterfaceSchemaReviewApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3; // preliminary + write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    // Action captured from this iteration
    const action: IPointer<
      | { type: "write"; data: IAutoBeInterfaceSchemaReviewApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        schema: props.reviewSchema,
        preliminary,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...buildHistories({
        state: ctx.state(),
        instruction: props.instruction,
        typeName: props.typeName,
        reviewOperations: props.reviewOperations,
        reviewSchema: props.reviewSchema,
        preliminary,
        failures,
        writeSucceeded,
      }),
    });

    // PRELIMINARY — delegate and continue
    if (action.value === null) {
      await orchestratePreliminary(ctx, {
        source_id: sourceId,
        source: SOURCE,
        preliminary,
        trial: i + 1,
        histories: result.histories,
      });
      continue;
    }

    // WRITE — validate externally
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const errors: IValidation.IError[] = [];
      AutoBeInterfaceSchemaReviewProgrammer.validate({
        typeName: props.typeName,
        schema: props.reviewSchema,
        excludes: writeData.excludes,
        revises: writeData.revises,
        errors,
        path: `$input.request`,
        everyModels:
          ctx.state().database?.result.data.files.flatMap((f) => f.models) ??
          [],
      });

      if (errors.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ errors, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `interfaceSchemaReview: ${props.typeName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const content: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
        AutoBeInterfaceSchemaReviewProgrammer.execute({
          schema: props.reviewSchema,
          revises: lastWrite.revises,
        });
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        typeName: props.typeName,
        schema: props.reviewSchema,
        review: lastWrite.review,
        excludes: lastWrite.excludes,
        revises: lastWrite.revises,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        step: ctx.state().analyze?.step ?? 0,
        total: props.progress.total,
        completed: ++props.progress.completed,
        created_at: new Date().toISOString(),
      } satisfies AutoBeInterfaceSchemaReviewEvent);
      return content;
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    return AutoBeInterfaceSchemaReviewProgrammer.execute({
      schema: props.reviewSchema,
      revises: lastWrite.revises,
    });
  }
  throw new Error(
    `interfaceSchemaReview: ${props.typeName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    operations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<PreliminaryKinds>;
    writeSucceeded: boolean;
    action: IPointer<
      | { type: "write"; data: IAutoBeInterfaceSchemaReviewApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaReviewApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  application = fixCompleteAvailability(application, props.writeSucceeded);
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
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeInterfaceSchemaReviewApplication,
  };
}

// ── Schema manipulation ──

/** Removes IComplete from the request union when no write has succeeded. */
function fixCompleteAvailability(
  application: ILlmApplication,
  writeSucceeded: boolean,
): ILlmApplication {
  if (writeSucceeded) return application;

  const func = application.functions.find((f) => f.name === "process");
  if (func === undefined) return application;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return application;
  if (LlmTypeChecker.isAnyOf(request) === false) return application;

  // biome-ignore lint: type narrowing insufficient after isAnyOf guard
  const anyOfSchema = request as ILlmSchema.IAnyOf;
  const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
  // biome-ignore lint: x-discriminator is a runtime extension property
  const mapping: Record<string, string> =
    (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
    null
      ? ((
          (anyOfSchema as unknown as Record<string, unknown>)[
            "x-discriminator"
          ] as Record<string, Record<string, string>>
        ).mapping ?? {})
      : {};

  const completeIdx = children.findIndex(
    (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
  );
  if (completeIdx !== -1) children.splice(completeIdx, 1);
  delete mapping["complete"];

  return application;
}

// ── History builder ──

function buildHistories(props: {
  state: ReturnType<AutoBeContext["state"]>;
  instruction: string;
  typeName: string;
  reviewOperations: AutoBeOpenApi.IOperation[];
  reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  preliminary: AutoBePreliminaryController<PreliminaryKinds>;
  failures: IWriteFailure[];
  writeSucceeded: boolean;
}) {
  const base = transformInterfaceSchemaReviewHistory({
    state: props.state,
    instruction: props.instruction,
    typeName: props.typeName,
    reviewOperations: props.reviewOperations,
    reviewSchema: props.reviewSchema,
    preliminary: props.preliminary,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] Validation errors:\n` +
      f.errors.map((e) => `  - ${e.path}: ${e.expected}`).join("\n"),
    created_at: new Date().toISOString(),
  }));

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed validation successfully. " +
            "You may now call complete(confirm: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps>;

const SOURCE = "interfaceSchemaReview" satisfies AutoBeEventSource;
