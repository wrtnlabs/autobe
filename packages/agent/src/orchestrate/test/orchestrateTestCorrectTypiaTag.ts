import {
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformTestCorrectTypiaTagHistories } from "./histories/transformTestCorrectTypiaTagHistories";
import { IAutoBeTestCorrectTypiaTagApplication } from "./structures/IAutoBeTestCorrectTypiaTagApplication";
import { IAutoBeTestFunction } from "./structures/IAutoBeTestFunction";
import { IAutoBeTestFunctionFailure } from "./structures/IAutoBeTestFunctionFailure";

type CompileFunction = (script: string) => Promise<AutoBeTestValidateEvent>;

export const orchestrateTestCorrectTypiaTag = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  write: IAutoBeTestFunction,
): Promise<AutoBeTestValidateEvent> => {
  const event: AutoBeTestValidateEvent = await compile(write.script);
  return await predicate(ctx, compile, [], write, event, ctx.retry);
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  failures: IAutoBeTestFunctionFailure[],
  write: IAutoBeTestFunction,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);
    return await correct(ctx, compile, failures, write, event, life - 1);
  }
  return event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  failures: IAutoBeTestFunctionFailure[],
  write: IAutoBeTestFunction,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type !== "failure") return event;
  else if (life < 0) return event;

  const pointer: IPointer<
    IAutoBeTestCorrectTypiaTagApplication.IProps | false | null
  > = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    histories: await transformTestCorrectTypiaTagHistories([
      ...failures,
      {
        function: write,
        failure: event.result,
      },
    ]),
    controller: createController({
      model: ctx.model,
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
  else if (pointer.value === false) return event;

  ctx.dispatch({
    type: "testCorrect",
    id: v7(),
    created_at: new Date().toISOString(),
    file: {
      scenario: write.scenario,
      location: write.location,
      content: write.script,
    },
    result: event.result,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final,
  } satisfies AutoBeTestCorrectEvent);
  const newWrite: IAutoBeTestFunction = {
    artifacts: write.artifacts,
    scenario: write.scenario,
    location: write.location,
    script: pointer.value.revise?.final ?? pointer.value.draft,
  };
  const newEvent: AutoBeTestValidateEvent = await compile(newWrite.script);
  return await predicate(
    ctx,
    compile,
    [
      ...failures,
      {
        function: write,
        failure: event.result,
      },
    ],
    newWrite,
    newEvent,
    life - 1,
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  then: (next: IAutoBeTestCorrectTypiaTagApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
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
    } satisfies IAutoBeTestCorrectTypiaTagApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeTestCorrectTypiaTagApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeTestCorrectTypiaTagApplication,
    "claude"
  >(),
};
