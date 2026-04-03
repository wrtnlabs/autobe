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
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { getEmbedder } from "../../utils/getEmbedder";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
import { transformRealizeOperationWriteHistory } from "./histories/transformRealizeOperationWriteHistory";
import { AutoBeRealizeOperationProgrammer } from "./programmers/AutoBeRealizeOperationProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeOperationWriteApplication } from "./structures/IAutoBeRealizeOperationWriteApplication";
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

// ── Main process ──

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

  const dto: Record<string, string> =
    await AutoBeRealizeOperationProgrammer.writeStructures(
      ctx,
      props.scenario.operation,
    );

  const cyclinic = new AutoBeCyclinicController<PreliminaryKinds>({
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
          props.scenario.operation.responseBody?.typeName.replace(/^IPage/, ""),
      ),
      analysisSections: ragSections,
    },
  });
  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeRealizeOperationWriteApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          functionName: props.scenario.functionName,
          cyclinic,
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
          preliminary: context.preliminary,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: TypeScript compilation
    async (writeData) => {
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

      return { success: diagnostics.length === 0, diagnostics };
    },
    // FINALIZE: dispatch event and return functor
    async (lastWrite, result) => {
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
      if (result !== null)
        ctx.dispatch({
          id: v7(),
          type: "realizeWrite",
          function: functor,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
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
  cyclinic: AutoBeCyclinicController<PreliminaryKinds>;
  action: IPointer<
    | { type: "write"; data: IAutoBeRealizeOperationWriteApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeOperationWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
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

  const application = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeRealizeOperationWriteApplication>({
        validate: { process: validate },
      }),
    ),
  );

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

// ── History builder ──

function buildHistories(props: {
  state: ReturnType<AutoBeContext["state"]>;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  dto: Record<string, string>;
  preliminary: AutoBeCyclinicController.IProcessContext<PreliminaryKinds>["preliminary"];
  failures: AutoBeCyclinicController.IFailure[];
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

  const failureEntries = props.failures.map((f) => {
    const diagnostics =
      f.diagnostics as IAutoBeTypeScriptCompileResult.IDiagnostic[];
    return {
      id: v7(),
      type: "systemMessage" as const,
      text:
        `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
        diagnostics
          .map(
            (d) =>
              `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
          )
          .join("\n"),
      created_at: new Date().toISOString(),
    };
  });

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
