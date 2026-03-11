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
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeState } from "../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformPreviousAndLatestCorrectHistory } from "../common/histories/transformPreviousAndLatestCorrectHistory";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeOperationCyclinicApplication } from "./structures/IAutoBeRealizeOperationCyclinicApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

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
          execute(ctx, {
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

type ActionPointerValue =
  | { type: "write"; data: IAutoBeRealizeOperationCyclinicApplication.IWrite }
  | { type: "complete" }
  | null;

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationCyclinicApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;

// ── Per-operation execution ──

async function execute(
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
  // Build RAG sections
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const pathSegments = props.scenario.operation.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      [
        "operation",
        "write",
        props.scenario.operation.method,
        ...pathSegments,
        props.scenario.functionName,
      ].join(" "),
      "TOPK",
      { log: false, logPrefix: "realizeOperationWrite" },
    );

  // Create cyclinic controller
  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeOperationCyclinicApplication>(),
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

  // Precompute static data
  const dto: Record<string, string> =
    await AutoBeRealizeOperationProgrammer.writeStructures(
      ctx,
      props.scenario.operation,
    );
  const additional: Record<string, string> =
    AutoBeRealizeOperationProgrammer.getAdditional({
      authorizations: props.totalAuthorizations,
      collectors: props.collectors,
      transformers: props.transformers,
    });

  // Closure state bridging validate → finalize
  let lastProcessedContent: string | null = null;
  let lastResult: AutoBeContext.IResult | null = null;

  // Run cyclinic loop
  return await cyclinic.orchestrate<
    IAutoBeRealizeOperationCyclinicApplication.IWrite,
    AutoBeRealizeOperationFunction
  >(
    ctx,

    // PROCESS
    async (context) => {
      const actionPointer: IPointer<ActionPointerValue> = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          functionName: props.scenario.functionName,
          onAction: (a) => {
            actionPointer.value = a;
          },
          cyclinic,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...buildHistories({
          state: ctx.state(),
          scenario: props.scenario,
          authorization: props.authorization,
          totalAuthorizations: props.totalAuthorizations,
          dto,
          cyclinic,
          failures: context.failures,
        }),
      });
      lastResult = result;

      if (actionPointer.value === null) return { result, action: null };
      if (actionPointer.value.type === "write")
        return {
          result,
          action: { type: "write", data: actionPointer.value.data },
        };
      return { result, action: { type: "complete" } };
    },

    // VALIDATE
    async (writeData) => {
      const code = writeData.revise.final ?? writeData.draft;
      const processedContent =
        await AutoBeRealizeOperationProgrammer.replaceImportStatements(ctx, {
          operation: props.scenario.operation,
          schemas: props.document.components.schemas,
          code,
          payload: props.authorization?.payload.name,
        });

      const compiled = await compileRealizeFiles(ctx, {
        functions: [
          {
            type: "operation" as const,
            endpoint: {
              method: props.scenario.operation.method,
              path: props.scenario.operation.path,
            },
            location: props.scenario.location,
            name: props.scenario.functionName,
            content: processedContent,
          },
        ],
        additional,
        progress: () => props.progress,
      });

      // Success: no failure or no diagnostics in this file
      if (compiled.result.type !== "failure") {
        lastProcessedContent = processedContent;
        return { success: true };
      }
      const fileDiagnostics = compiled.result.diagnostics.filter(
        (d) => d.file === props.scenario.location,
      );
      if (fileDiagnostics.length === 0) {
        lastProcessedContent = processedContent;
        return { success: true };
      }

      return {
        success: false,
        diagnostics: { code: processedContent, diagnostics: fileDiagnostics },
      };
    },

    // FINALIZE
    () => {
      const functor: AutoBeRealizeOperationFunction = {
        type: "operation",
        endpoint: {
          method: props.scenario.operation.method,
          path: props.scenario.operation.path,
        },
        location: props.scenario.location,
        name: props.scenario.functionName,
        content: lastProcessedContent!,
      };
      ctx.dispatch({
        id: v7(),
        type: "realizeWrite",
        function: functor,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        metric: lastResult!.metric,
        tokenUsage: lastResult!.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeRealizeWriteEvent);
      return functor;
    },
  );
}

// ── Controller factory ──

function createController(props: {
  functionName: string;
  onAction: (action: Exclude<ActionPointerValue, null>) => void;
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
}): ILlmController {
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeRealizeOperationCyclinicApplication.IProps>(input);
    if (result.success === false) return result;

    const request = result.data.request;

    if (request.type !== "write" && request.type !== "complete") {
      return props.cyclinic.getPreliminary().validate({
        thinking: result.data.thinking,
        request,
      });
    }

    if (request.type === "write") {
      const errors = validateEmptyCode({
        name: props.functionName,
        draft: request.draft,
        revise: request.revise,
        path: "$input.request",
        asynchronous: true,
      });
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }

    return result;
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    props.cyclinic.getPreliminary().fixApplication(
      typia.llm.application<IAutoBeRealizeOperationCyclinicApplication>({
        validate: { process: validate },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.onAction({ type: "write", data: next.request });
        else if (next.request.type === "complete")
          props.onAction({ type: "complete" });
      },
    } satisfies IAutoBeRealizeOperationCyclinicApplication,
  };
}

// ── History builder ──

function buildHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  failures: AutoBeCyclinicController.IFailure[];
}): IAutoBeOrchestrateHistory {
  const baseHistory = transformRealizeOperationWriteHistory({
    state: props.state,
    scenario: props.scenario,
    authorization: props.authorization,
    totalAuthorizations: props.totalAuthorizations,
    dto: props.dto,
    preliminary: props.cyclinic.getPreliminary(),
  });

  if (props.failures.length === 0) return baseHistory;

  // Build correction history from failures
  const failureEntries = transformPreviousAndLatestCorrectHistory(
    props.failures.map((f) => {
      const diag = f.diagnostics as {
        code: string;
        diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
      };
      return { script: diag.code, diagnostics: diag.diagnostics };
    }),
  );

  const successEntries = props.cyclinic.hasWriteSucceeded()
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed validation successfully. " +
            "You may now call complete(are_you_sure: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    histories: [
      ...baseHistory.histories,
      {
        id: v7(),
        type: "systemMessage" as const,
        text: AutoBeSystemPromptConstant.REALIZE_OPERATION_CORRECT,
        created_at: new Date().toISOString(),
      },
      ...failureEntries,
      ...successEntries,
    ] as IAutoBeOrchestrateHistory["histories"],
    userMessage: StringUtil.trim`
      Correct the TypeScript compilation errors and resubmit the corrected
      code via write.

      When modifying, modify the entire code, but not the import statement.
    `,
  };
}
