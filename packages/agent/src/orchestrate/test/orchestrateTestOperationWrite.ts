import { IAgenticaController } from "@agentica/core";
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
import { NamingConvention } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { getTestScenarioArtifacts } from "./compile/getTestArtifacts";
import { transformTestOperationWriteHistory } from "./histories/transformTestOperationWriteHistory";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";
import { IAutoBeTestOperationWriteApplication } from "./structures/IAutoBeTestOperationWriteApplication";
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
            process(ctx, {
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

// ── Main process ──

async function process(
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
  const cyclinic = new AutoBeCyclinicController<never>({
    application: typia.json.application<IAutoBeTestOperationWriteApplication>(),
    source: SOURCE,
    kinds: [],
    state: ctx.state(),
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeTestOperationWriteApplication.IWrite }
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
        ...(await buildHistories({
          ctx,
          scenario: props.scenario,
          artifacts: props.artifacts,
          authorizes: props.authorizes,
          generates: props.generates,
          instruction: props.instruction,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        })),
      });

      return { result, action: action.value };
    },
    // VALIDATE: TypeScript compilation
    async (writeData) => {
      const domain: string = writeData.domain;
      const location = `test/features/api/${domain}/${props.scenario.functionName}.ts`;
      const content: string =
        await AutoBeTestOperationProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          authorizes: props.authorizes,
          prepares: props.prepares,
          generates: props.generates,
          location,
          content: writeData.revise.final ?? writeData.draft,
        });

      const functor: AutoBeTestOperationFunction = {
        type: "operation",
        domain,
        scenario: props.scenario,
        name: props.scenario.functionName,
        location,
        content,
      };

      const procedure: IAutoBeTestOperationProcedure = {
        type: "operation",
        artifacts: props.artifacts,
        function: functor,
        authorizes: props.authorizes,
        generates: props.generates,
        prepares: props.prepares,
      };

      const compileResult = await AutoBeTestOperationProgrammer.compile({
        compiler: await ctx.compiler(),
        document: props.document,
        procedure,
        progress: props.progress,
        step: ctx.state().analyze?.step ?? 0,
      });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileResult.result.type === "failure"
          ? compileResult.result.diagnostics.filter(
              (d) => d.file === functor.location,
            )
          : [];

      return { success: diagnostics.length === 0, diagnostics };
    },
    // FINALIZE: dispatch event and return procedure
    async (lastWrite, result) => {
      const domain: string = lastWrite.domain;
      const location = `test/features/api/${domain}/${props.scenario.functionName}.ts`;
      const content: string =
        await AutoBeTestOperationProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          authorizes: props.authorizes,
          prepares: props.prepares,
          generates: props.generates,
          location,
          content: lastWrite.revise.final ?? lastWrite.draft,
        });

      const functor: AutoBeTestOperationFunction = {
        type: "operation",
        domain,
        scenario: props.scenario,
        name: props.scenario.functionName,
        location,
        content,
      };

      if (result !== null)
        ctx.dispatch({
          id: v7(),
          type: "testWrite",
          function: functor,
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          completed: ++props.progress.completed,
          total: props.progress.total,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        } satisfies AutoBeTestWriteEvent);

      return {
        type: "operation",
        artifacts: props.artifacts,
        function: functor,
        authorizes: props.authorizes,
        generates: props.generates,
        prepares: props.prepares,
      };
    },
  );
}

// ── Controller factory ──

function createController(props: {
  functionName: string;
  cyclinic: AutoBeCyclinicController<never>;
  action: IPointer<
    | { type: "write"; data: IAutoBeTestOperationWriteApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestOperationWriteApplication.IProps> => {
    const result: IValidation<IAutoBeTestOperationWriteApplication.IProps> =
      typia.validate<IAutoBeTestOperationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const req = result.data.request;
    if (req.type === "write") {
      const errors: IValidation.IError[] = validateEmptyCode({
        name: props.functionName,
        draft: req.draft,
        revise: req.revise,
        asynchronous: true,
        path: "$input.request",
      });
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }
    return result;
  };

  const application = props.cyclinic.fixCompleteAvailability(
    typia.llm.application<IAutoBeTestOperationWriteApplication>({
      validate: { process: validate },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write") {
          input.request.domain = NamingConvention.snake(input.request.domain);
          props.action.value = { type: "write", data: input.request };
        } else if (input.request.type === "complete") {
          props.action.value = { type: "complete" };
        }
      },
    } satisfies IAutoBeTestOperationWriteApplication,
  };
}

// ── History builder ──

async function buildHistories(props: {
  ctx: AutoBeContext;
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  authorizes: AutoBeTestAuthorizeFunction[];
  generates: AutoBeTestGenerateFunction[];
  instruction: string;
  failures: AutoBeCyclinicController.IFailure[];
  writeSucceeded: boolean;
}) {
  const base = await transformTestOperationWriteHistory(props.ctx, {
    authorizationFunctions: props.authorizes,
    generationFunctions: props.generates,
    scenario: props.scenario,
    artifacts: props.artifacts,
    instruction: props.instruction,
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
            "You may now call complete to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}

const SOURCE = "testWrite" satisfies AutoBeEventSource;
