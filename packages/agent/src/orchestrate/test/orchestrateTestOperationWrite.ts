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
import { LlmTypeChecker, NamingConvention } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestScenarioArtifacts } from "./compile/getTestArtifacts";
import { transformTestOperationWriteHistory } from "./histories/transformTestOperationWriteHistory";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";
import { IAutoBeTestOperationWriteApplication } from "./structures/IAutoBeTestOperationWriteApplication";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

const MAX_WRITE_ATTEMPTS = 3;

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

// ── Types ──

interface IWriteFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  iteration: number;
}

// ── Main loop ──

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
  let lastWrite: IAutoBeTestOperationWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];

  const maxIterations = MAX_WRITE_ATTEMPTS * 2; // write + complete headroom

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeTestOperationWriteApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        functionName: props.scenario.functionName,
        writeSucceeded,
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
        failures,
        writeSucceeded,
      })),
    });

    // WRITE — compile and validate
    if (action.value !== null && action.value.type === "write") {
      const writeData = action.value.data;
      const domain: string = NamingConvention.snake(writeData.domain);
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

      if (diagnostics.length === 0) {
        lastWrite = { ...writeData, domain };
        writeSucceeded = true;
      } else {
        failures.push({ diagnostics, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `testOperationWrite: ${props.scenario.functionName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (
      action.value !== null &&
      action.value.type === "complete" &&
      lastWrite !== null
    ) {
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
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
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

    return {
      type: "operation",
      artifacts: props.artifacts,
      function: functor,
      authorizes: props.authorizes,
      generates: props.generates,
      prepares: props.prepares,
    };
  }
  throw new Error(
    `testOperationWrite: ${props.scenario.functionName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(props: {
  functionName: string;
  writeSucceeded: boolean;
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

  let application: ILlmApplication =
    typia.llm.application<IAutoBeTestOperationWriteApplication>({
      validate: {
        process: validate,
      },
    });
  application = fixCompleteAvailability(application, props.writeSucceeded);

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
      ? (((anyOfSchema as unknown as Record<string, unknown>)[
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

async function buildHistories(props: {
  ctx: AutoBeContext;
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  authorizes: AutoBeTestAuthorizeFunction[];
  generates: AutoBeTestGenerateFunction[];
  instruction: string;
  failures: IWriteFailure[];
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
