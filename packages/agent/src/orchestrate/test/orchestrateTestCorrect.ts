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
  writeResults: IAutoBeTestFunction[],
): Promise<AutoBeTestValidateEvent[]> => {
  const result: Array<AutoBeTestValidateEvent | null> =
    await executeCachedBatch(
      writeResults.map((w) => async (promptCacheKey) => {
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
            transformTestValidateEvent(y, w.artifacts),
            [],
            y,
            promptCacheKey,
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
  content: IAutoBeTestFunction,
  failures: IAutoBeTestFunctionFailure[],
  event: AutoBeTestValidateEvent,
  promptCacheKey: string,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") ctx.dispatch(event);
  return event.result.type === "failure"
    ? await correct(ctx, content, failures, event, promptCacheKey, life - 1)
    : event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  content: IAutoBeTestFunction,
  failures: IAutoBeTestFunctionFailure[],
  validate: AutoBeTestValidateEvent,
  promptCacheKey: string,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (validate.result.type !== "failure") return validate;
  else if (life < 0) return validate;

  const pointer: IPointer<IAutoBeTestCorrectApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    histories: await transformTestCorrectHistories(ctx, content, [
      ...failures,
      {
        function: content,
        failure: validate.result,
      },
    ]),
    controller: createController({
      model: ctx.model,
      failure: validate.result,
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
    promptCacheKey,
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");

  pointer.value.revise.final = await completeTestCode(
    ctx,
    content.artifacts,
    pointer.value.revise.final,
  );
  pointer.value.draft = await completeTestCode(
    ctx,
    content.artifacts,
    pointer.value.draft,
  );

  ctx.dispatch({
    type: "testCorrect",
    id: v7(),
    created_at: new Date().toISOString(),
    file: validate.file,
    result: validate.result,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final,
  } satisfies AutoBeTestCorrectEvent);
  const newContent: IAutoBeTestFunction = {
    ...content,
    script: pointer.value.revise?.final ?? pointer.value.draft,
  };
  const newValidate: AutoBeTestValidateEvent = await compileTestFile(
    ctx,
    newContent,
  );
  return predicate(
    ctx,
    newContent,
    [
      ...failures,
      {
        function: content,
        failure: validate.result,
      },
    ],
    newValidate,
    promptCacheKey,
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
