import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformPreviousAndLatestCorrectHistory } from "../common/histories/transformPreviousAndLatestCorrectHistory";
import { getTestScenarioArtifacts } from "./compile/getTestArtifacts";
import { transformTestOperationWriteHistory } from "./histories/transformTestOperationWriteHistory";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationCyclinicApplication } from "./structures/IAutoBeTestOperationCyclinicApplication";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export async function orchestrateTestOperationWrite(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    scenarios: AutoBeTestScenario[];
    authorizes: AutoBeTestAuthorizeFunction[];
    prepares: AutoBeTestPrepareFunction[];
    generates: AutoBeTestGenerateFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestOperationProcedure[]> {
  const result: Array<IAutoBeTestOperationProcedure | null> =
    await executeCachedBatch(
      ctx,
      props.scenarios.map((scenario) => async (promptCacheKey) => {
        const artifacts: IAutoBeTestScenarioArtifacts =
          await getTestScenarioArtifacts(ctx, scenario);
        const usedActors: Set<string> = new Set(
          artifacts.document.operations
            .map((o) => o.authorizationActor)
            .filter((a) => a !== null),
        );

        const authorizationFunctions: AutoBeTestAuthorizeFunction[] =
          props.authorizes.filter((f) => usedActors.has(f.actor));
        const generationFunctions: AutoBeTestGenerateFunction[] =
          props.generates.filter((f) =>
            artifacts.document.operations.some(
              (o) =>
                o.method === f.endpoint.method && o.path === f.endpoint.path,
            ),
          );
        const prepareFunctions: AutoBeTestPrepareFunction[] =
          props.prepares.filter((f) =>
            Object.keys(artifacts.document.components.schemas).includes(
              f.typeName,
            ),
          );

        try {
          return await forceRetry(() =>
            execute(ctx, {
              document: props.document,
              scenario,
              authorizes: authorizationFunctions,
              generates: generationFunctions,
              prepares: prepareFunctions,
              artifacts,
              progress: props.progress,
              promptCacheKey,
              instruction: props.instruction,
            }),
          );
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
}

type DummyKind = "databaseSchemas";

async function execute(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    scenario: AutoBeTestScenario;
    authorizes: AutoBeTestAuthorizeFunction[];
    generates: AutoBeTestGenerateFunction[];
    prepares: AutoBeTestPrepareFunction[];
    artifacts: IAutoBeTestScenarioArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<IAutoBeTestOperationProcedure> {
  // ── Create cyclinic controller (dummy preliminary — test ops have none) ──
  const cyclinic = new AutoBeCyclinicController<DummyKind>({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeTestOperationCyclinicApplication>(),
    kinds: ["databaseSchemas"],
    state: ctx.state(),
  });

  // ── Pre-compute static write history (avoids re-computing each iteration) ──
  const baseHistory: IAutoBeOrchestrateHistory =
    await transformTestOperationWriteHistory(ctx, {
      instruction: props.instruction,
      scenario: props.scenario,
      artifacts: props.artifacts,
      authorizationFunctions: props.authorizes,
      generationFunctions: props.generates,
    });

  // ── Closure state for validate → finalize bridging ──
  let lastProcessedContent: string | null = null;
  let lastResult: AutoBeContext.IResult | null = null;
  let lastDomain: string | null = null;

  // ── Run cyclinic write-compile-correct loop ──
  return await cyclinic.orchestrate<
    IAutoBeTestOperationCyclinicApplication.IWrite,
    IAutoBeTestOperationProcedure
  >(
    ctx,

    // ── PROCESS: one LLM iteration ──
    async (context) => {
      const actionPointer: IPointer<
        | {
            type: "write";
            data: IAutoBeTestOperationCyclinicApplication.IWrite;
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
          baseHistory,
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
      const domain: string = NamingConvention.snake(writeData.domain);
      const code: string = writeData.revise.final ?? writeData.draft;
      const location: string = `test/features/api/${domain}/${props.scenario.functionName}.ts`;

      const processedContent: string =
        await AutoBeTestOperationProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          prepares: props.prepares,
          generates: props.generates,
          authorizes: props.authorizes,
          location,
          content: code,
        });

      const tempProcedure: IAutoBeTestOperationProcedure = {
        type: "operation",
        artifacts: props.artifacts,
        function: {
          type: "operation",
          domain,
          scenario: props.scenario,
          name: props.scenario.functionName,
          location,
          content: processedContent,
        },
        prepares: props.prepares,
        generates: props.generates,
        authorizes: props.authorizes,
      };

      const compiled = await AutoBeTestOperationProgrammer.compile({
        compiler: await ctx.compiler(),
        document: props.document,
        procedure: tempProcedure,
        progress: props.progress,
        step: ctx.state().analyze?.step ?? 0,
      });

      // Filter diagnostics to only this file's location
      if (compiled.result.type === "failure") {
        compiled.result.diagnostics = compiled.result.diagnostics.filter(
          (d) => d.file === location,
        );
        if (compiled.result.diagnostics.length === 0) {
          compiled.result = { type: "success" };
        }
      }

      if (compiled.result.type !== "failure") {
        lastProcessedContent = processedContent;
        lastDomain = domain;
        return { success: true };
      }

      return {
        success: false,
        diagnostics: {
          code: processedContent,
          diagnostics: compiled.result.diagnostics,
        },
      };
    },

    // ── FINALIZE: create procedure and dispatch event ──
    (_lastWrite) => {
      const location: string = `test/features/api/${lastDomain!}/${props.scenario.functionName}.ts`;
      const functor: AutoBeTestOperationFunction = {
        type: "operation",
        domain: lastDomain!,
        scenario: props.scenario,
        name: props.scenario.functionName,
        location,
        content: lastProcessedContent!,
      };
      ctx.dispatch({
        type: "testWrite",
        id: v7(),
        created_at: new Date().toISOString(),
        function: functor,
        metric: lastResult!.metric,
        tokenUsage: lastResult!.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().interface?.step ?? 0,
      } satisfies AutoBeTestWriteEvent);

      return {
        type: "operation",
        artifacts: props.artifacts,
        function: functor,
        prepares: props.prepares,
        generates: props.generates,
        authorizes: props.authorizes,
      } satisfies IAutoBeTestOperationProcedure;
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
          data: IAutoBeTestOperationCyclinicApplication.IWrite;
        }
      | { type: "complete" },
  ) => void;
  cyclinic: AutoBeCyclinicController<DummyKind>;
}): ILlmController {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestOperationCyclinicApplication.IProps> =
      typia.validate<IAutoBeTestOperationCyclinicApplication.IProps>(input);
    if (result.success === false) return result;

    const request = result.data.request;

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
    typia.llm.application<IAutoBeTestOperationCyclinicApplication>({
      validate: { process: validate },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write") {
          next.request.domain = NamingConvention.snake(next.request.domain);
          props.onAction({ type: "write", data: next.request });
        } else if (next.request.type === "complete") {
          props.onAction({ type: "complete" });
        }
      },
    } satisfies IAutoBeTestOperationCyclinicApplication,
  };
}

// ── History builder ──

function buildHistories(props: {
  baseHistory: IAutoBeOrchestrateHistory;
  cyclinic: AutoBeCyclinicController<DummyKind>;
  failures: AutoBeCyclinicController.IFailure[];
}): IAutoBeOrchestrateHistory {
  // No failures → return base write history as-is
  if (props.failures.length === 0) return props.baseHistory;

  // With failures → add correction context and diagnostics
  const failureEntries = transformPreviousAndLatestCorrectHistory(
    props.failures.map((f) => {
      const diag = f.diagnostics as {
        code: string;
        diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
      };
      return {
        script: diag.code,
        diagnostics: diag.diagnostics,
      };
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
      ...props.baseHistory.histories,
      {
        id: v7(),
        type: "systemMessage" as const,
        text: AutoBeSystemPromptConstant.TEST_OPERATION_CORRECT_OVERALL,
        created_at: new Date().toISOString(),
      },
      ...failureEntries,
      ...successEntries,
    ] as IAutoBeOrchestrateHistory["histories"],
    userMessage: "Fix the compile errors in the test code please",
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestOperationCyclinicApplication.IProps>;

const SOURCE = "testWrite" satisfies AutoBeEventSource;
