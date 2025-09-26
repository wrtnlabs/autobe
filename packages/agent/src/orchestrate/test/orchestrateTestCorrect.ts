import { IAgenticaController } from "@agentica/core";
import {
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { orchestrateCommonCorrectCasting } from "../common/orchestrateCommonCorrectCasting";
import { completeTestCode } from "./compile/completeTestCode";
import { transformTestCorrectHistories } from "./histories/transformTestCorrectHistories";
import { transformTestValidateEvent } from "./histories/transformTestValidateEvent";
import { orchestrateTestCorrectInvalidRequest } from "./orchestrateTestCorrectInvalidRequest";
import { IAutoBeTestCorrectApplication } from "./structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestFunction } from "./structures/IAutoBeTestFunction";
import { IAutoBeTestFunctionFailure } from "./structures/IAutoBeTestFunctionFailure";

export const orchestrateTestCorrect = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    functions: IAutoBeTestFunction[];
  },
): Promise<AutoBeTestValidateEvent[]> => {
  const result: Array<AutoBeTestValidateEvent | null> =
    await executeCachedBatch(
      props.functions.map((w) => async (promptCacheKey) => {
        try {
          const compile = (script: string) =>
            compileTestFile(ctx, {
              ...w,
              script,
            });
          const x: AutoBeTestValidateEvent =
            await orchestrateTestCorrectInvalidRequest(ctx, compile, w);
          const y: AutoBeTestValidateEvent =
            await orchestrateCommonCorrectCasting(
              ctx,
              {
                source: "testCorrect",
                validate: compile,
                correct: (next) =>
                  ({
                    type: "testCorrect",
                    id: v7(),
                    created_at: new Date().toISOString(),
                    file: {
                      scenario: w.scenario,
                      location: w.location,
                      content: next.final ?? next.draft,
                    },
                    result: next.failure,
                    tokenUsage: next.tokenUsage,
                    think: next.think,
                    draft: next.draft,
                    review: next.review,
                    final: next.final,
                    step: ctx.state().analyze?.step ?? 0,
                  }) satisfies AutoBeTestCorrectEvent,
                script: (event) => event.file.content,
              },
              x.file.content,
            );
          return await predicate(
            ctx,
            {
              function: transformTestValidateEvent(y, w.artifacts),
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
  func: IAutoBeTestFunction,
): Promise<AutoBeTestValidateEvent> => {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const result: IAutoBeTypeScriptCompileResult = await compiler.test.compile({
    files: {
      ...func.artifacts.dto,
      ...func.artifacts.sdk,
      [func.location]: func.script,
    },
  });
  return {
    type: "testValidate",
    id: v7(),
    file: {
      scenario: func.scenario,
      location: func.location,
      content: func.script,
    },
    result,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  };
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    function: IAutoBeTestFunction;
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
    function: IAutoBeTestFunction;
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
  const { tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    histories: await transformTestCorrectHistories(ctx, {
      instruction: props.instruction,
      function: props.function,
      failures: [
        ...props.failures,
        {
          function: props.function,
          failure: props.validate.result,
        },
      ],
    }),
    controller: createController({
      model: ctx.model,
      failure: props.validate.result,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Fix the AutoBeTest.IFunction data to resolve the compilation error.

      You don't need to explain me anything, but just fix it immediately
      without any hesitation, explanation, and questions.
    `,
    promptCacheKey: props.promptCacheKey,
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");

  pointer.value.revise.final = await completeTestCode(
    ctx,
    props.function.artifacts,
    pointer.value.revise.final,
  );
  pointer.value.draft = await completeTestCode(
    ctx,
    props.function.artifacts,
    pointer.value.draft,
  );

  ctx.dispatch({
    type: "testCorrect",
    id: v7(),
    created_at: new Date().toISOString(),
    file: props.validate.file,
    result: props.validate.result,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final,
  } satisfies AutoBeTestCorrectEvent);
  const newFunction: IAutoBeTestFunction = {
    ...props.function,
    script: pointer.value.revise?.final ?? pointer.value.draft,
  };
  const newValidate: AutoBeTestValidateEvent = await compileTestFile(
    ctx,
    newFunction,
  );
  return predicate(
    ctx,
    {
      function: newFunction,
      failures: [
        ...props.failures,
        {
          function: props.function,
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
  failure: IAutoBeTypeScriptCompileResult.IFailure;
  build: (next: IAutoBeTestCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestCorrectApplication.IProps> => {
    const result: IValidation<IAutoBeTestCorrectApplication.IProps> =
      typia.validate<IAutoBeTestCorrectApplication.IProps>(input);
    // if (result.success === false) return result;

    // const expected: number = props.failure.diagnostics.length;
    // const actual: number = result.data.think.analyses.length;
    // if (expected !== actual)
    //   return {
    //     success: false,
    //     errors: [
    //       {
    //         path: "$input.think.analyses",
    //         expected: `Array<IValidation<IAutoBeTypeScriptCompileResult.IDiagnostic>> & MinItems<${expected}> & MaxItems<${expected}>`,
    //         value: result.data.think.analyses,
    //         description: StringUtil.trim`
    //           The 'think.analyses' must contain all the compilation errors.

    //           Therefore, the length of the 'think.analyses' must be not
    //           ${actual}, but exactly ${expected}, which is equal to the length of
    //           the 'diagnostics' of the compilation failure.
    //         `,
    //       },
    //     ],
    //     data: input,
    //   };
    return result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
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
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectApplication.IProps>;
