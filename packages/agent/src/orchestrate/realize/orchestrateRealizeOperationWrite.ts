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
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { IAutoBeRealizeOperationCyclinicApplication } from "./structures/IAutoBeRealizeOperationCyclinicApplication";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { generateTS2339Hints } from "./utils/generateTS2339Hints";
import { printErrorHints } from "./utils/printErrorHints";

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

type PreliminaryKinds =
  | "analysisSections"
  | "databaseSchemas"
  | "realizeCollectors"
  | "realizeTransformers";

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
  // ── Build RAG sections ──
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

  // ── Create cyclinic controller ──
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

  // ── Precompute static data ──
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

  // ── Closure state for validate → finalize bridging ──
  let lastProcessedContent: string | null = null;
  let lastResult: AutoBeContext.IResult | null = null;

  // ── Run cyclinic write-compile-correct loop ──
  return await cyclinic.orchestrate<
    IAutoBeRealizeOperationCyclinicApplication.IWrite,
    AutoBeRealizeOperationFunction
  >(
    ctx,

    // ── PROCESS: one LLM iteration ──
    async (context) => {
      const actionPointer: IPointer<
        | {
            type: "write";
            data: IAutoBeRealizeOperationCyclinicApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
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

    // ── VALIDATE: compile submitted code ──
    async (writeData) => {
      const code: string = writeData.revise.final ?? writeData.draft;
      const processedContent: string =
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
        diagnostics: {
          code: processedContent,
          diagnostics: fileDiagnostics,
        },
      };
    },

    // ── FINALIZE: create function and dispatch event ──
    (_lastWrite) => {
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
  onAction: (
    action:
      | {
          type: "write";
          data: IAutoBeRealizeOperationCyclinicApplication.IWrite;
        }
      | { type: "complete" },
  ) => void;
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationCyclinicApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationCyclinicApplication.IProps>(input);
    if (result.success === false) return result;

    const request = result.data.request;

    // Preliminary request → delegate to preliminary validation
    if (request.type !== "write" && request.type !== "complete") {
      return props.cyclinic.getPreliminary().validate({
        thinking: result.data.thinking,
        request,
      });
    }

    // Write request → validate code content
    if (request.type === "write") {
      const errors: IValidation.IError[] = validateEmptyCode({
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

    // Complete request → accept as-is
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
        // else: preliminary → actionPointer stays null → action = null
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
  const baseHistory: IAutoBeOrchestrateHistory =
    transformRealizeOperationWriteHistory({
      state: props.state,
      scenario: props.scenario,
      authorization: props.authorization,
      totalAuthorizations: props.totalAuthorizations,
      dto: props.dto,
      preliminary: props.cyclinic.getPreliminary(),
    });

  // No failures → return base write history as-is
  if (props.failures.length === 0) {
    return baseHistory;
  }

  // With failures → add correction context and diagnostics
  const failureEntries = props.failures.map((failure, i) => {
    const diag = failure.diagnostics as {
      code: string;
      diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
    };
    const isLatest = i === props.failures.length - 1;
    const ts2339Hints = isLatest
      ? generateTS2339Hints(diag.diagnostics)
      : "";

    return {
      id: v7(),
      type: "assistantMessage" as const,
      text: StringUtil.trim`
        ${
          isLatest
            ? "# Latest Failure"
            : StringUtil.trim`
              # Previous Failure

              This is a previous failure for your reference.

              Never try to fix this previous failure code, but only
              focus on the latest failure below. This is provided just
              to give you context about your past mistakes.

              If same mistake happens again, you must try to not
              repeat the same mistake. Change your approach to fix
              the issue.
            `
        }

        ## Original Code

        Here is the previous code you have to review and fix.

        \`\`\`typescript
        ${diag.code}
        \`\`\`

        ## Compilation Errors

        Here are the compilation errors found in the code above.

        \`\`\`json
        ${JSON.stringify(diag.diagnostics)}
        \`\`\`

        ## Error Annotated Code

        Here is the error annotated code.

        Please refer to the annotation for the location of the error.

        By the way, note that, this code is only for reference purpose.
        Never fix code from this error annotated code. You must fix
        the original code above.

        ${printErrorHints(diag.code, diag.diagnostics)}

        ${ts2339Hints}
      `,
      created_at: new Date().toISOString(),
    };
  });

  const successEntries = props.cyclinic.hasWriteSucceeded()
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed validation successfully. " +
            'You may now call complete(are_you_sure: true) to finalize.',
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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeOperationCyclinicApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
