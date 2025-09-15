import {
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
  IAutoBeTokenUsageJson,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformCommonCorrectCastingHistories } from "./histories/transformCommonCorrectCastingHistories";
import { IAutoBeCommonCorrectCastingApplication } from "./structures/IAutoBeCommonCorrectCastingApplication";

interface IFactoryProps<
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
> {
  validate(script: string): Promise<ValidateEvent>;
  correct(next: {
    failure: IAutoBeTypeScriptCompileResult.IFailure;
    think: string;
    draft: string;
    review: string | undefined;
    final: string | undefined;
    tokenUsage: IAutoBeTokenUsageJson.IComponent;
  }): CorrectEvent;
  script(event: ValidateEvent): string;
  source: "testCorrect" | "realizeCorrect";
}

export const orchestrateCommonCorrectCasting = async <
  Model extends ILlmSchema.Model,
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext<Model>,
  factory: IFactoryProps<ValidateEvent, CorrectEvent>,
  script: string,
): Promise<ValidateEvent> => {
  const event: ValidateEvent = await factory.validate(script);
  return await predicate(ctx, factory, [], script, event, ctx.retry);
};

const predicate = async <
  Model extends ILlmSchema.Model,
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext<Model>,
  factory: IFactoryProps<ValidateEvent, CorrectEvent>,
  failures: ValidateEvent[],
  script: string,
  event: ValidateEvent,
  life: number,
): Promise<ValidateEvent> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);
    return await correct(ctx, factory, failures, script, event, life - 1);
  }
  return event;
};

const correct = async <
  Model extends ILlmSchema.Model,
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext<Model>,
  factory: IFactoryProps<ValidateEvent, CorrectEvent>,
  failures: ValidateEvent[],
  script: string,
  event: ValidateEvent,
  life: number,
): Promise<ValidateEvent> => {
  if (event.result.type !== "failure") return event;
  else if (life < 0) return event;

  const pointer: IPointer<
    IAutoBeCommonCorrectCastingApplication.IProps | false | null
  > = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: factory.source,
    histories: transformCommonCorrectCastingHistories(
      [...failures, event].map((e) => ({
        diagnostics: (e.result as IAutoBeTypeScriptCompileResult.IFailure)
          .diagnostics,
        script: factory.script(e),
      })),
    ),
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
      Fix the TypeScript casting problems to resolve the compilation error.

      You don't need to explain me anything, but just fix or give it up 
      immediately without any hesitation, explanation, and questions.
    `,
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");
  else if (pointer.value === false) return event;

  ctx.dispatch(
    factory.correct({
      failure: event.result,
      think: pointer.value.think,
      draft: pointer.value.draft,
      review: pointer.value.revise.review,
      final: pointer.value.revise.final,
      tokenUsage,
    }),
  );
  return await predicate(
    ctx,
    factory,
    [...failures, event],
    script,
    await factory.validate(pointer.value.revise.final),
    life - 1,
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
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
    } satisfies IAutoBeCommonCorrectCastingApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "claude"
  >(),
};
