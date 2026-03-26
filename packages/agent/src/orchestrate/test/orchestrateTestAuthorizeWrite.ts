import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import {
  AutoBeFunctionCallingMetricFactory,
  AutoBeOpenApiTypeChecker,
} from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsageComponent } from "../../context/AutoBeTokenUsageComponent";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestAuthorizeWriteHistory } from "./histories/transformTestAuthorizeWriteHistory";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestAuthorizationWriteApplication } from "./structures/IAutoBeTestAuthorizationWriteApplication";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";

const MAX_WRITE_ATTEMPTS = 3;

/**
 * Test Authorization Write Orchestrator
 *
 * Creates authorization utility functions for test scenarios. Template-based
 * auth uses direct code generation; "join" auth type uses a
 * write-validate-correct loop for LLM-generated code.
 */
export const orchestrateTestAuthorizeWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    progress: AutoBeProgressEventBase;
    document: AutoBeOpenApi.IDocument;
  },
): Promise<IAutoBeTestAuthorizeProcedure[]> => {
  const authOperations: AutoBeOpenApi.IOperation[] =
    props.document.operations.filter(
      (op) =>
        op.authorizationActor !== null &&
        op.authorizationType !== null &&
        op.parameters.length === 0 &&
        op.requestBody !== null &&
        op.responseBody !== null &&
        AutoBeOpenApiTypeChecker.isObject(
          props.document.components.schemas[op.requestBody.typeName] ?? {},
        ),
    );
  return await executeCachedBatch(
    ctx,
    authOperations.map((operation) => async (promptCacheKey) => {
      const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
        endpoint: {
          method: operation.method,
          path: operation.path,
        },
      });

      if (operation.authorizationType === "join") {
        // LLM-based path with write-validate-correct loop
        const procedure: IAutoBeTestAuthorizeProcedure = await forceRetry(() =>
          processJoin(ctx, {
            operation,
            artifacts,
            progress: props.progress,
            promptCacheKey,
          }),
        );
        return procedure;
      } else {
        // Template-based path (no LLM needed)
        const event: AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction> =
          await writeTemplate(ctx, {
            document: props.document,
            progress: props.progress,
            artifacts,
            operation,
          });
        ctx.dispatch(event);
        return {
          type: "authorize" as const,
          artifacts,
          function: event.function,
          operation,
        };
      }
    }),
  );
};

// ── Types ──

interface IWriteFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  iteration: number;
}

// ── Template-based path (unchanged) ──

async function writeTemplate(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction>> {
  const schema: AutoBeOpenApi.IJsonSchema | undefined =
    props.document.components.schemas[
      props.operation.requestBody?.typeName ?? ""
    ];
  if (
    schema === undefined ||
    AutoBeOpenApiTypeChecker.isObject(schema) === false
  )
    throw new Error("Authorization operation needs object request body.");
  else if (props.operation.authorizationActor === null)
    throw new Error("Operation is not an authorization operation.");

  const functionName: string = AutoBeTestAuthorizeProgrammer.getFunctionName(
    props.operation,
  );
  const content: string = AutoBeTestAuthorizeProgrammer.writeTemplate({
    operation: props.operation,
    schema,
  });
  const authorizationFunction: AutoBeTestAuthorizeFunction = {
    type: "authorize",
    endpoint: {
      method: props.operation.method,
      path: props.operation.path,
    },
    actor: props.operation.authorizationActor,
    authType: props.operation.authorizationType!,
    location: `test/authorize/${functionName}.ts`,
    name: functionName,
    content: await AutoBeTestAuthorizeProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: props.artifacts,
      content,
    }),
  };
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    function: authorizationFunction,
    metric: AutoBeFunctionCallingMetricFactory.create(),
    tokenUsage: new AutoBeTokenUsageComponent(),
    completed: ++props.progress.completed,
    total: props.progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction>;
}

// ── LLM-based join path with write-validate-correct loop ──

async function processJoin(
  ctx: AutoBeContext,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<IAutoBeTestAuthorizeProcedure> {
  const functionName: string = AutoBeTestAuthorizeProgrammer.getFunctionName(
    props.operation,
  );
  const location: string = `test/authorize/${functionName}.ts`;
  let lastWrite: IAutoBeTestAuthorizationWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const maxIterations = MAX_WRITE_ATTEMPTS * 3;
  const dummyProgress: AutoBeProgressEventBase = { completed: 0, total: 0 };

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeTestAuthorizationWriteApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "testWrite",
      controller: createController({
        operation: props.operation,
        functionName,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await buildHistories(ctx, {
        operation: props.operation,
        artifacts: props.artifacts,
        failures,
        writeSucceeded,
      })),
    });

    // No action — skip
    if (action.value === null) continue;

    // WRITE — compile and validate
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const code: string =
        await AutoBeTestAuthorizeProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          content: writeData.revise.final ?? writeData.draft,
        });

      const func: AutoBeTestAuthorizeFunction = {
        type: "authorize",
        endpoint: {
          method: props.operation.method,
          path: props.operation.path,
        },
        actor: writeData.actor,
        authType: props.operation.authorizationType!,
        location,
        name: functionName,
        content: code,
      };
      const procedure: IAutoBeTestAuthorizeProcedure = {
        type: "authorize",
        artifacts: props.artifacts,
        function: func,
        operation: props.operation,
      };

      const compileEvent: AutoBeTestValidateEvent<AutoBeTestAuthorizeFunction> =
        await AutoBeTestAuthorizeProgrammer.compile({
          compiler: await ctx.compiler(),
          procedure,
          progress: dummyProgress,
          step: ctx.state().analyze?.step ?? 0,
        });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileEvent.result.type === "failure"
          ? compileEvent.result.diagnostics.filter(
              (d) => d.file === func.location,
            )
          : [];

      if (diagnostics.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ diagnostics, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `testAuthorizeWrite: ${functionName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const code: string =
        await AutoBeTestAuthorizeProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          content: lastWrite.revise.final ?? lastWrite.draft,
        });
      const func: AutoBeTestAuthorizeFunction = {
        type: "authorize",
        endpoint: {
          method: props.operation.method,
          path: props.operation.path,
        },
        actor: lastWrite.actor,
        authType: props.operation.authorizationType!,
        location,
        name: functionName,
        content: code,
      };
      ctx.dispatch({
        type: "testWrite",
        id: v7(),
        created_at: new Date().toISOString(),
        function: func,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().interface?.step ?? 0,
      } satisfies AutoBeTestWriteEvent<AutoBeTestAuthorizeFunction>);
      return {
        type: "authorize",
        artifacts: props.artifacts,
        function: func,
        operation: props.operation,
      };
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    const code: string =
      await AutoBeTestAuthorizeProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        artifacts: props.artifacts,
        content: lastWrite.revise.final ?? lastWrite.draft,
      });
    return {
      type: "authorize",
      artifacts: props.artifacts,
      function: {
        type: "authorize",
        endpoint: {
          method: props.operation.method,
          path: props.operation.path,
        },
        actor: lastWrite.actor,
        authType: props.operation.authorizationType!,
        location,
        name: functionName,
        content: code,
      },
      operation: props.operation,
    };
  }
  throw new Error(
    `testAuthorizeWrite: ${functionName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(props: {
  operation: AutoBeOpenApi.IOperation;
  functionName: string;
  writeSucceeded: boolean;
  action: IPointer<
    | { type: "write"; data: IAutoBeTestAuthorizationWriteApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestAuthorizationWriteApplication.IProps> => {
    const result: IValidation<IAutoBeTestAuthorizationWriteApplication.IProps> =
      typia.validate<IAutoBeTestAuthorizationWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const req = result.data.request;
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

  let application: ILlmApplication =
    typia.llm.application<IAutoBeTestAuthorizationWriteApplication>({
      validate: {
        process: validate,
      },
    });
  application = fixCompleteAvailability(application, props.writeSucceeded);

  return {
    protocol: "class",
    name: "TestAuthorizationWrite",
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeTestAuthorizationWriteApplication,
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

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    failures: IWriteFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformTestAuthorizeWriteHistory(ctx, {
    operation: props.operation,
    artifacts: props.artifacts,
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
