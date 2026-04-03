import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceSchemaReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { AutoBeDatabaseModelProgrammer } from "../prisma/programmers/AutoBeDatabaseModelProgrammer";
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

  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
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

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeInterfaceSchemaReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController(ctx, {
          typeName: props.typeName,
          operations: props.document.operations,
          schema: props.reviewSchema,
          cyclinic,
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
          preliminary: context.preliminary,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: schema validation
    async (writeData) => {
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
      return { success: errors.length === 0, diagnostics: errors };
    },
    // FINALIZE: dispatch event and return schema
    (lastWrite, result) => {
      const content: AutoBeOpenApi.IJsonSchemaDescriptive.IObject =
        AutoBeInterfaceSchemaReviewProgrammer.execute({
          schema: props.reviewSchema,
          revises: lastWrite.revises,
        });
      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          typeName: props.typeName,
          schema: props.reviewSchema,
          review: lastWrite.review,
          excludes: lastWrite.excludes,
          revises: lastWrite.revises,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          step: ctx.state().analyze?.step ?? 0,
          total: props.progress.total,
          completed: ++props.progress.completed,
          created_at: new Date().toISOString(),
        } satisfies AutoBeInterfaceSchemaReviewEvent);
      return content;
    },
  );
}

// ── Controller factory ──

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    operations: AutoBeOpenApi.IOperation[];
    cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
    action: IPointer<
      | { type: "write"; data: IAutoBeInterfaceSchemaReviewApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaReviewApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });
    return result;
  };

  let application = preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>({
      validate: { process: validate },
    }),
  );
  AutoBeInterfaceSchemaReviewProgrammer.fixApplication({
    everyModels:
      ctx.state().database?.result.data.files.flatMap((f) => f.models) ?? [],
    application,
    typeName: props.typeName,
    schema: props.schema,
  });
  application = props.cyclinic.fixCompleteAvailability(application);

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

// ── History builder ──

function buildHistories(props: {
  state: ReturnType<AutoBeContext["state"]>;
  instruction: string;
  typeName: string;
  reviewOperations: AutoBeOpenApi.IOperation[];
  reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  preliminary: AutoBeCyclinicController.IProcessContext<PreliminaryKinds>["preliminary"];
  failures: AutoBeCyclinicController.IFailure[];
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

  const failureEntries = props.failures.map((f) => {
    const text =
      typeof f.diagnostics === "string"
        ? `[Iteration ${f.iteration + 1}] ${f.diagnostics}`
        : `[Write attempt ${f.iteration + 1} FAILED] Validation errors:\n` +
          (f.diagnostics as IValidation.IError[])
            .map((e) => `  - ${e.path}: ${e.expected}`)
            .join("\n");
    return {
      id: v7(),
      type: "systemMessage" as const,
      text,
      created_at: new Date().toISOString(),
    };
  });

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
