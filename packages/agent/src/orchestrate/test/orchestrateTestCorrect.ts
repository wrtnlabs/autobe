import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeTestAuthorizeWriteFunction,
  AutoBeTestCorrectEvent,
  AutoBeTestGenerateWriteFunction,
  AutoBeTestPrepareWriteFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { orchestrateCommonCorrectCasting } from "../common/orchestrateCommonCorrectCasting";
import { completeTestCode } from "./compile/completeTestCode";
import { transformTestCorrectOverallHistory } from "./histories/transformTestCorrectOverallHistory";
import { transformTestValidateEvent } from "./histories/transformTestValidateEvent";
import { orchestrateTestCorrectInvalidRequest } from "./orchestrateTestCorrectInvalidRequest";
import { IAutoBeTestAgentResult } from "./structures/IAutoBeTestAgentResult";
import { IAutoBeTestCorrectApplication } from "./structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestFunctionFailure } from "./structures/IAutoBeTestFunctionFailure";
import { getTestImportFromFunction } from "./utils/getTestImportFromFunction";
import { insertScriptToTestResult } from "./utils/insertScriptToTestResult";

export const orchestrateTestCorrect = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    items: IAutoBeTestAgentResult[];
  },
): Promise<AutoBeTestValidateEvent[]> => {
  const result: Array<AutoBeTestValidateEvent | null> =
    await executeCachedBatch(
      ctx,
      props.items.map((w) => async (promptCacheKey) => {
        try {
          const compile = (script: string) =>
            compileTestFile(ctx, {
              ...insertScriptToTestResult(w, script),
            });
          const x: AutoBeTestValidateEvent =
            await orchestrateTestCorrectInvalidRequest(ctx, compile, w);
          const y: AutoBeTestValidateEvent =
            await orchestrateCommonCorrectCasting(
              ctx,
              {
                source: "testCorrect",
                validate: async (script: string) => {
                  const importStatement: string = getTestImportFromFunction({
                    target: w,
                  });

                  return compile(
                    await completeTestCode(
                      ctx,
                      w.artifacts,
                      script,
                      importStatement,
                    ),
                  );
                },
                correct: (next) =>
                  ({
                    type: "testCorrect",
                    kind: "casting",
                    id: v7(),
                    created_at: new Date().toISOString(),
                    function: insertScriptToTestResult(
                      w,
                      next.final ?? next.draft,
                    ).function,
                    result: next.failure,
                    tokenUsage: next.tokenUsage,
                    metric: next.metric,
                    step: ctx.state().analyze?.step ?? 0,
                  }) satisfies AutoBeTestCorrectEvent,
                script: (event) => event.function.content,
                functionName: w.function.functionName,
              },
              x.function.content,
            );
          return await predicate(
            ctx,
            {
              target: transformTestValidateEvent(y, w),
              failures: [],
              validate: y,
              promptCacheKey,
              instruction: props.instruction,
            },
            ctx.retry,
          );
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
};

const compileTestFile = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  item: IAutoBeTestAgentResult,
): Promise<AutoBeTestValidateEvent> => {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const template: Record<string, string> = Object.fromEntries(
    Object.entries(
      await compiler.getTemplate({
        dbms: "sqlite",
        phase: "test",
      }),
    ).filter(([key]) => key.startsWith("test/utils") && key.endsWith(".ts")),
  );

  // Use full document to generate complete SDK/DTO files
  // This prevents type truncation when multiple artifacts reference the same DTO file
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const fullArtifacts: Record<string, string> = await compiler.interface.write(
    document,
    [],
  );
  const fullSdk: Record<string, string> = Object.fromEntries(
    Object.entries(fullArtifacts).filter(
      ([key]) =>
        key.startsWith("src/api") && !key.startsWith("src/api/structures"),
    ),
  );
  const fullDto: Record<string, string> = Object.fromEntries(
    Object.entries(fullArtifacts).filter(([key]) =>
      key.startsWith("src/api/structures"),
    ),
  );

  const helperFunctions: (
    | AutoBeTestAuthorizeWriteFunction
    | AutoBeTestGenerateWriteFunction
    | AutoBeTestPrepareWriteFunction
  )[] =
    item.type === "operation"
      ? [
          ...item.authorizeFunctions,
          ...item.generateFunctions,
          ...item.prepareFunctions,
        ]
      : item.type === "generate"
        ? [item.prepareFunction]
        : [];

  const files: Record<string, string> = {
    ...template,
    ...fullDto,
    ...fullSdk,
    ...Object.fromEntries(helperFunctions.map((f) => [f.location, f.content])),
    [item.function.location]: item.function.content,
  };

  const result: IAutoBeTypeScriptCompileResult = await compiler.test.compile({
    files,
  });

  return {
    type: "testValidate",
    id: v7(),
    function: item.function,
    result,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  };
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    target: IAutoBeTestAgentResult;
    failures: IAutoBeTestFunctionFailure[];
    validate: AutoBeTestValidateEvent;
    promptCacheKey: string;
    instruction: string;
  },
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (props.validate.result.type === "failure") ctx.dispatch(props.validate);
  return props.validate.result.type === "failure"
    ? await correct(ctx, props, life - 1)
    : props.validate;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    target: IAutoBeTestAgentResult;
    failures: IAutoBeTestFunctionFailure[];
    validate: AutoBeTestValidateEvent;
    promptCacheKey: string;
    instruction: string;
  },
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (props.validate.result.type !== "failure") return props.validate;
  else if (life < 0) return props.validate;

  const pointer: IPointer<IAutoBeTestCorrectApplication.IProps | null> = {
    value: null,
  };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    controller: createController({
      model: ctx.model,
      functionName: props.target.function.functionName,
      failure: props.validate.result,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...(await transformTestCorrectOverallHistory(ctx, {
      instruction: props.instruction,
      target: props.target,
      failures: [
        ...props.failures,
        {
          target: props.target,
          failure: props.validate.result,
        },
      ],
    })),
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");

  const importStatement: string = getTestImportFromFunction({
    target: props.target,
  });

  if (pointer.value.revise.final)
    pointer.value.revise.final = await completeTestCode(
      ctx,
      props.target.artifacts,
      pointer.value.revise.final,
      importStatement,
    );
  pointer.value.draft = await completeTestCode(
    ctx,
    props.target.artifacts,
    pointer.value.draft,
    importStatement,
  );

  ctx.dispatch({
    type: "testCorrect",
    kind: "overall",
    id: v7(),
    created_at: new Date().toISOString(),
    function: insertScriptToTestResult(
      props.target,
      pointer.value.revise.final ?? pointer.value.draft,
    ).function,
    result: props.validate.result,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final ?? undefined,
  } satisfies AutoBeTestCorrectEvent);

  const newTarget: IAutoBeTestAgentResult = insertScriptToTestResult(
    props.target,
    pointer.value.revise?.final ?? pointer.value.draft,
  );
  const newValidate: AutoBeTestValidateEvent = await compileTestFile(
    ctx,
    newTarget,
  );
  return predicate(
    ctx,
    {
      target: newTarget,
      failures: [
        ...props.failures,
        {
          target: props.target,
          failure: props.validate.result,
        },
      ],
      validate: newValidate,
      promptCacheKey: props.promptCacheKey,
      instruction: props.instruction,
    },
    life,
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  failure: IAutoBeTypeScriptCompileResult.IFailure;
  build: (next: IAutoBeTestCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestCorrectApplication.IProps> => {
    const result: IValidation<IAutoBeTestCorrectApplication.IProps> =
      typia.validate<IAutoBeTestCorrectApplication.IProps>(input);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "correct",
    application,
    execute: {
      rewrite: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestCorrectApplication,
  };
};

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectApplication, "chatgpt">({
      validate: {
        rewrite: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectApplication, "claude">({
      validate: {
        rewrite: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectApplication, "gemini">({
      validate: {
        rewrite: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectApplication.IProps>;
