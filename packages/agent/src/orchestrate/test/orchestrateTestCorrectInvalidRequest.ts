import { AutoBeTestValidateEvent } from "@autobe/interface";
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
import { transformTestCorrectInvalidRequestHistory } from "./histories/transformTestCorrectInvalidRequestHistory";
import { IAutoBeTestCorrectInvalidRequestApplication } from "./structures/IAutoBeTestCorrectInvalidRequestApplication";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";
import { IAutoBeTestProcedure } from "./structures/IAutoBeTestProcedure";
import { getTestImportFromFunction } from "./utils/getTestImportFromFunction";
import { insertScriptToTestResult } from "./utils/insertScriptToTestResult";

type CompileFunction = (script: string) => Promise<AutoBeTestValidateEvent>;

export const orchestrateTestCorrectInvalidRequest = async <
  Model extends ILlmSchema.Model,
  Procedure extends
    | IAutoBeTestOperationProcedure
    | IAutoBeTestGenerateProcedure,
>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  procedure: Procedure,
): Promise<AutoBeTestValidateEvent> => {
  const event: AutoBeTestValidateEvent = await compile(
    procedure.function.content,
  );
  return await predicate(ctx, compile, procedure, event, ctx.retry);
};

const predicate = async <
  Model extends ILlmSchema.Model,
  Procedure extends
    | IAutoBeTestOperationProcedure
    | IAutoBeTestGenerateProcedure,
>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  procedure: Procedure,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);
    return await correct(ctx, compile, procedure, event, life - 1);
  }
  return event;
};

const correct = async <
  Model extends ILlmSchema.Model,
  Procedure extends
    | IAutoBeTestOperationProcedure
    | IAutoBeTestGenerateProcedure,
>(
  ctx: AutoBeContext<Model>,
  compile: CompileFunction,
  procedure: Procedure,
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
    controller: createController({
      model: ctx.model,
      functionName: procedure.function.name,
      then: (next) => {
        pointer.value = next;
      },
      reject: () => {
        pointer.value = false;
      },
    }),
    enforceFunctionCall: true,
    ...transformTestCorrectInvalidRequestHistory(
      procedure,
      event.result.diagnostics,
    ),
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");
  else if (pointer.value === false) return event; // other's responsibility

  const importStatement: string = getTestImportFromFunction({
    target: procedure,
  });

  if (pointer.value.revise.final)
    pointer.value.revise.final = await completeTestCode(
      ctx,
      procedure.artifacts,
      pointer.value.revise.final,
      importStatement,
    );
  pointer.value.draft = await completeTestCode(
    ctx,
    procedure.artifacts,
    pointer.value.draft,
    importStatement,
  );
  ctx.dispatch({
    type: "testCorrect",
    kind: "request",
    id: v7(),
    created_at: new Date().toISOString(),
    function: {
      ...insertScriptToTestResult(
        procedure,
        pointer.value.revise.final ?? pointer.value.draft,
      ).function,
    },
    result: event.result,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final ?? undefined,
  });

  const newWrite: IAutoBeTestProcedure = insertScriptToTestResult(
    procedure,
    pointer.value.revise?.final ?? pointer.value.draft,
  );
  const newEvent: AutoBeTestValidateEvent = await compile(
    newWrite.function.content,
  );
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
      path: "$input",
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
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
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
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestCorrectInvalidRequestApplication,
      "gemini"
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
