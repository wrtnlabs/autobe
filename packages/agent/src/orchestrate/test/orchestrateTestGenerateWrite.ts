import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { getTestArtifacts } from "./compile/getTestArtifacts";
import { transformTestGenerateWriteHistory } from "./histories/transformTestGenerationWriteHistory";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestArtifacts } from "./structures/IAutoBeTestArtifacts";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";
import { IAutoBeTestGenerationWriteApplication } from "./structures/IAutoBeTestGenerationWriteApplication";

export const orchestrateTestGenerateWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestGenerateProcedure[]> => {
  const result: Array<IAutoBeTestGenerateProcedure | null> =
    await executeCachedBatch(
      ctx,
      props.document.operations.map((operation) => async (promptCacheKey) => {
        if (operation.requestBody === null) return null;
        else if (operation.requestBody.typeName.endsWith(".ICreate") === false)
          return null;
        else if (
          props.document.components.schemas[operation.requestBody.typeName] ===
          undefined
        )
          return null;
        else if (
          AutoBeOpenApiTypeChecker.isObject(
            props.document.components.schemas[operation.requestBody.typeName],
          ) === false
        )
          return null;

        const prepareFunction: AutoBeTestPrepareFunction | undefined =
          props.prepares.find(
            (pf) => pf.typeName === operation.requestBody?.typeName,
          );
        if (prepareFunction === undefined) return null;

        const artifacts: IAutoBeTestArtifacts = await getTestArtifacts(ctx, {
          endpoint: {
            path: operation.path,
            method: operation.method,
          },
        });

        try {
          return await forceRetry(() =>
            process(ctx, {
              prepare: prepareFunction,
              artifacts,
              operation,
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
};

// ── Main process ──

async function process(
  ctx: AutoBeContext,
  props: {
    prepare: AutoBeTestPrepareFunction;
    artifacts: IAutoBeTestArtifacts;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<IAutoBeTestGenerateProcedure> {
  const functionName: string = AutoBeTestGenerateProgrammer.getFunctionName(
    props.operation,
  );
  const location: string = `test/generate/${functionName}.ts`;

  const cyclinic = new AutoBeCyclinicController<never>({
    application:
      typia.json.application<IAutoBeTestGenerationWriteApplication>(),
    source: "testWrite",
    kinds: [],
    state: ctx.state(),
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeTestGenerationWriteApplication.IWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: "testWrite",
        controller: createController({
          functionName,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...(await buildHistories(ctx, {
          instruction: props.instruction,
          prepare: props.prepare,
          operation: props.operation,
          artifacts: props.artifacts,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        })),
      });

      return { result, action: action.value };
    },
    // VALIDATE: TypeScript compilation
    async (writeData) => {
      const dummyProgress: AutoBeProgressEventBase = { completed: 0, total: 0 };
      const code: string =
        await AutoBeTestGenerateProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          prepare: props.prepare,
          location,
          content: writeData.revise.final ?? writeData.draft,
        });

      const func: AutoBeTestGenerateFunction = {
        type: "generate",
        endpoint: {
          method: props.operation.method,
          path: props.operation.path,
        },
        actor: props.operation.authorizationActor,
        location,
        name: functionName,
        content: code,
      };
      const procedure: IAutoBeTestGenerateProcedure = {
        type: "generate",
        prepare: props.prepare,
        artifacts: props.artifacts,
        function: func,
        operation: props.operation,
      };

      const compileEvent: AutoBeTestValidateEvent<AutoBeTestGenerateFunction> =
        await AutoBeTestGenerateProgrammer.compile({
          compiler: await ctx.compiler(),
          step: ctx.state().analyze?.step ?? 0,
          progress: dummyProgress,
          procedure,
        });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileEvent.result.type === "failure"
          ? compileEvent.result.diagnostics.filter(
              (d) => d.file === func.location,
            )
          : [];

      return { success: diagnostics.length === 0, diagnostics };
    },
    // FINALIZE: dispatch event and return procedure
    async (lastWrite, result) => {
      const code: string =
        await AutoBeTestGenerateProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          artifacts: props.artifacts,
          prepare: props.prepare,
          location,
          content: lastWrite.revise.final ?? lastWrite.draft,
        });
      const func: AutoBeTestGenerateFunction = {
        type: "generate",
        endpoint: {
          method: props.operation.method,
          path: props.operation.path,
        },
        actor: props.operation.authorizationActor,
        location,
        name: functionName,
        content: code,
      };
      if (result !== null)
        ctx.dispatch({
          type: "testWrite",
          id: v7(),
          created_at: new Date().toISOString(),
          function: func,
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          completed: ++props.progress.completed,
          total: props.progress.total,
          step: ctx.state().test?.step ?? 0,
        } satisfies AutoBeTestWriteEvent);
      return {
        type: "generate",
        prepare: props.prepare,
        artifacts: props.artifacts,
        function: func,
        operation: props.operation,
      };
    },
  );
}

// ── Controller factory ──

function createController(props: {
  functionName: string;
  cyclinic: AutoBeCyclinicController<never>;
  action: IPointer<
    | { type: "write"; data: IAutoBeTestGenerationWriteApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestGenerationWriteApplication.IProps> => {
    const result: IValidation<IAutoBeTestGenerationWriteApplication.IProps> =
      typia.validate<IAutoBeTestGenerationWriteApplication.IProps>(input);
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

  const application = props.cyclinic.fixCompleteAvailability(
    typia.llm.application<IAutoBeTestGenerationWriteApplication>({
      validate: { process: validate },
    }),
  );

  return {
    protocol: "class",
    name: "testGenerationWrite",
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeTestGenerationWriteApplication,
  };
}

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    prepare: AutoBeTestPrepareFunction;
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
    failures: AutoBeCyclinicController.IFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformTestGenerateWriteHistory(ctx, {
    instruction: props.instruction,
    prepare: props.prepare,
    operation: props.operation,
    artifacts: props.artifacts,
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
