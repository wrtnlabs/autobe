import {
  AutoBeFunctionCallingMetric,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
  IAutoBeTokenUsageJson,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { transformCommonCorrectCastingHistory } from "./histories/transformCommonCorrectCastingHistory";
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
    metric: AutoBeFunctionCallingMetric;
    tokenUsage: IAutoBeTokenUsageJson.IComponent;
  }): Promise<CorrectEvent>;
  script(event: ValidateEvent): string;
  source: "testCorrect" | "realizeCorrect";
  functionName: string;
}

export const orchestrateCommonCorrectCasting = async <
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext,
  factory: IFactoryProps<ValidateEvent, CorrectEvent>,
  script: string,
): Promise<ValidateEvent> => {
  const event: ValidateEvent = await factory.validate(script);
  return await predicate(ctx, factory, [], script, event, ctx.retry);
};

const predicate = async <
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext,
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
  ValidateEvent extends AutoBeTestValidateEvent | AutoBeRealizeValidateEvent,
  CorrectEvent extends AutoBeTestCorrectEvent | AutoBeRealizeCorrectEvent,
>(
  ctx: AutoBeContext,
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
  const { metric, tokenUsage } = await ctx.conversate({
    source: factory.source,
    controller: createController({
      functionName: factory.functionName,
      then: (next) => {
        pointer.value = next;
      },
      reject: () => {
        pointer.value = false;
      },
    }),
    enforceFunctionCall: true,
    ...transformCommonCorrectCastingHistory(
      [...failures, event].map((e) => ({
        diagnostics: (e.result as IAutoBeTypeScriptCompileResult.IFailure)
          .diagnostics,
        script: factory.script(e),
      })),
    ),
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");
  else if (pointer.value === false) return event;

  ctx.dispatch(
    await factory.correct({
      failure: event.result,
      think: pointer.value.think,
      draft: pointer.value.draft,
      review: pointer.value.revise.review,
      final: pointer.value.revise.final ?? undefined,
      metric,
      tokenUsage,
    }),
  );
  return await predicate(
    ctx,
    factory,
    [...failures, event],
    script,
    await factory.validate(pointer.value.revise.final ?? pointer.value.draft),
    life - 1,
  );
};

const createController = (props: {
  functionName: string;
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
  reject: () => void;
}): ILlmController => {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeCommonCorrectCastingApplication.IProps> => {
    const result: IValidation<IAutoBeCommonCorrectCastingApplication.IProps> =
      typia.validate<IAutoBeCommonCorrectCastingApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
      path: "$input",
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication =
    typia.llm.application<IAutoBeCommonCorrectCastingApplication>({
      validate: {
        rewrite: validate,
        reject: () => ({
          success: true,
          data: undefined,
        }),
      },
    });
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
