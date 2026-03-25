import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeOperationWriteApplication } from "./structures/IAutoBeRealizeOperationWriteApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

const MAX_WRITE_ATTEMPTS = 3;

export async function orchestrateRealizeOperationWrite(
  ctx: AutoBeContext,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const scenarios: IAutoBeRealizeScenarioResult[] = document.operations.map(
    (operation) =>
      AutoBeRealizeOperationProgrammer.getScenario({
        authorizations: props.authorizations,
        operation,
      }),
  );
  return await executeCachedBatch(
    ctx,
    scenarios.map(
      (s) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            document,
            totalAuthorizations: props.authorizations,
            collectors: props.collectors,
            transformers: props.transformers,
            authorization: s.decoratorEvent ?? null,
            scenario: s,
            progress: props.progress,
            promptCacheKey,
          }),
        ),
    ),
  );
}

// ── Types ──

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "realizeCollectors"
  | "realizeTransformers";

interface IWriteFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  iteration: number;
}

// ── Main loop ──

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    authorization: AutoBeRealizeAuthorization | null;
    collectors: AutoBeRealizeCollectorFunction[];
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    transformers: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeOperationFunction> {
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );

  const pathSegments = props.scenario.operation.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
  const queryText: string = [
    "operation",
    "write",
    props.scenario.operation.method,
    ...pathSegments,
    props.scenario.functionName,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "realizeOperationWrite" },
    );

  const preliminary = new AutoBePreliminaryController<PreliminaryKinds>({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeOperationWriteApplication>(),
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "realizeCollectors",
      "realizeTransformers",
    ],
    state: ctx.state(),
    all: {
      realizeCollectors: props.collectors,
      realizeTransformers: props.transformers,
    },
    local: {
      realizeCollectors: props.collectors.filter(
        (c) =>
          c.plan.dtoTypeName === props.scenario.operation.requestBody?.typeName,
      ),
      realizeTransformers: props.transformers.filter(
        (t) =>
          t.plan.dtoTypeName ===
          props.scenario.operation.responseBody?.typeName,
      ),
      analysisSections: ragSections,
    },
  });

  const dto: Record<string, string> =
    await AutoBeRealizeOperationProgrammer.writeStructures(
      ctx,
      props.scenario.operation,
    );

  // Write-validate-correct loop state
  let lastWrite: IAutoBeRealizeOperationWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3; // preliminary + write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeRealizeOperationWriteApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        functionName: props.scenario.functionName,
        preliminary,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...buildHistories({
        state: ctx.state(),
        scenario: props.scenario,
        authorization: props.authorization,
        totalAuthorizations: props.totalAuthorizations,
        dto,
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

    // WRITE — compile and validate
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const code: string =
        await AutoBeRealizeOperationProgrammer.replaceImportStatements(ctx, {
          operation: props.scenario.operation,
          schemas: props.document.components.schemas,
          code: writeData.revise.final ?? writeData.draft,
          payload: props.authorization?.payload.name,
        });

      const functor: AutoBeRealizeOperationFunction = {
        type: "operation",
        endpoint: {
          method: props.scenario.operation.method,
          path: props.scenario.operation.path,
        },
        location: props.scenario.location,
        name: props.scenario.functionName,
        content: code,
      };

      const compileResult = await compileRealizeFiles(ctx, {
        functions: [functor],
        additional: AutoBeRealizeOperationProgrammer.getAdditional({
          authorizations: props.totalAuthorizations,
          collectors: props.collectors,
          transformers: props.transformers,
        }),
        progress: () => props.progress,
      });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileResult.result.type === "failure"
          ? compileResult.result.diagnostics.filter(
              (d) => d.file === functor.location,
            )
          : [];

      if (diagnostics.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ diagnostics, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `realizeOperationWrite: ${props.scenario.functionName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const content: string =
        await AutoBeRealizeOperationProgrammer.replaceImportStatements(ctx, {
          operation: props.scenario.operation,
          schemas: props.document.components.schemas,
          code: lastWrite.revise.final ?? lastWrite.draft,
          payload: props.authorization?.payload.name,
        });
      const functor: AutoBeRealizeOperationFunction = {
        type: "operation",
        endpoint: {
          method: props.scenario.operation.method,
          path: props.scenario.operation.path,
        },
        location: props.scenario.location,
        name: props.scenario.functionName,
        content,
      };
      ctx.dispatch({
        id: v7(),
        type: "realizeWrite",
        function: functor,
        acquisition: preliminary.getAcquisition(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeRealizeWriteEvent);
      return functor;
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    const content: string =
      await AutoBeRealizeOperationProgrammer.replaceImportStatements(ctx, {
        operation: props.scenario.operation,
        schemas: props.document.components.schemas,
        code: lastWrite.revise.final ?? lastWrite.draft,
        payload: props.authorization?.payload.name,
      });
    return {
      type: "operation",
      endpoint: {
        method: props.scenario.operation.method,
        path: props.scenario.operation.path,
      },
      location: props.scenario.location,
      name: props.scenario.functionName,
      content,
    };
  }
  throw new Error(
    `realizeOperationWrite: ${props.scenario.functionName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(
  _ctx: AutoBeContext,
  props: {
    functionName: string;
    preliminary: AutoBePreliminaryController<PreliminaryKinds>;
    writeSucceeded: boolean;
    action: IPointer<
      | { type: "write"; data: IAutoBeRealizeOperationWriteApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    if (req.type === "write") {
      const errors: IValidation.IError[] = validateEmptyCode({
        name: props.functionName,
        draft: req.draft,
        revise: req.revise,
        path: "$input.request",
        asynchronous: true,
      });
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeOperationWriteApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  application = fixCompleteAvailability(application, props.writeSucceeded);

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
    } satisfies IAutoBeRealizeOperationWriteApplication,
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
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
  preliminary: AutoBePreliminaryController<PreliminaryKinds>;
  failures: IWriteFailure[];
  writeSucceeded: boolean;
}) {
  const base = transformRealizeOperationWriteHistory({
    state: props.state,
    scenario: props.scenario,
    authorization: props.authorization,
    totalAuthorizations: props.totalAuthorizations,
    dto: props.dto,
    preliminary: props.preliminary,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
      f.diagnostics
        .map(
          (d) =>
            `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
        )
        .join("\n"),
    created_at: new Date().toISOString(),
  }));

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed TypeScript compilation successfully. " +
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
) => IValidation<IAutoBeRealizeOperationWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
