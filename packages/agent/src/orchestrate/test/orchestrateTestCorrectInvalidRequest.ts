import {
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmController,
  ILlmSchema,
  IValidation,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { completeTestCode } from "./compile/completeTestCode";
import { transformTestCorrectInvalidRequestHistories } from "./histories/transformTestCorrectInvalidRequestHistories";
import { IAutoBeTestCorrectInvalidRequestApplication } from "./structures/IAutoBeTestCorrectInvalidRequestApplication";
import { IAutoBeTestFunction } from "./structures/IAutoBeTestFunction";

type CompileFunction = (script: string) => Promise<AutoBeTestValidateEvent>;

export const orchestrateTestCorrectInvalidRequest = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  write: IAutoBeTestFunction,
): Promise<AutoBeTestValidateEvent> => {
  const event: AutoBeTestValidateEvent = await compile(write.script);
  return await predicate(ctx, compile, write, event, ctx.retry);
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  write: IAutoBeTestFunction,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);
    return await correct(ctx, compile, write, event, life - 1);
  }
  return event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  write: IAutoBeTestFunction,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type !== "failure") return event;
  else if (life < 0) return event;

  const pointer: IPointer<
    IAutoBeTestCorrectInvalidRequestApplication.IProps | false | null
  > = {
    value: null,
  };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    histories: await transformTestCorrectInvalidRequestHistories(
      null!,
      event.result.diagnostics,
    ),
    controller: createController({
      model: ctx.model,
      functionName: write.scenario.functionName,
      then: (next) => {
        pointer.value = next;
      },
      reject: () => {
        pointer.value = false;
      },
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Fix the AutoBeTest.IFunction data to resolve the compilation error.

      You don't need to explain me anything, but just fix or give it up
      immediately without any hesitation, explanation, and questions.
    `,
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");
  else if (pointer.value === false) return event; // other's responsibility

  if (pointer.value.revise.final)
    pointer.value.revise.final = await completeTestCode(
      ctx,
      write.artifacts,
      pointer.value.revise.final,
    );
  pointer.value.draft = await completeTestCode(
    ctx,
    write.artifacts,
    pointer.value.draft,
  );
  ctx.dispatch({
    type: "testCorrect",
    kind: "request",
    id: v7(),
    created_at: new Date().toISOString(),
    file: {
      scenario: write.scenario,
      location: write.location,
      content: write.script,
    },
    result: event.result,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final ?? undefined,
  } satisfies AutoBeTestCorrectEvent);
  const newWrite: IAutoBeTestFunction = {
    artifacts: write.artifacts,
    scenario: write.scenario,
    location: write.location,
    script: pointer.value.revise?.final ?? pointer.value.draft,
  };
  const newEvent: AutoBeTestValidateEvent = await compile(newWrite.script);
  return await predicate(ctx, compile, newWrite, newEvent, life - 1);
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  then: (next: IAutoBeTestCorrectInvalidRequestApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestCorrectInvalidRequestApplication.IProps> =
      typia.validate<IAutoBeTestCorrectInvalidRequestApplication.IProps>(input);
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
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](validate) satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "correctInvalidRequest",
    application,
    execute: {
      rewrite: (next) => {
        props.then(next);
      },
      reject: () => {
        props.reject();
      },
    } satisfies IAutoBeTestCorrectInvalidRequestApplication,
  };
};

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestCorrectInvalidRequestApplication,
      "chatgpt"
    >({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestCorrectInvalidRequestApplication,
      "claude"
    >({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectInvalidRequestApplication.IProps>;
