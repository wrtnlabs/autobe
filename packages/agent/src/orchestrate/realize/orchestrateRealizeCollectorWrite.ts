import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeCollectorWriteHistories } from "./histories/transformRealizeCollectorWriteHistories";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

export async function orchestrateRealizeCollectorWrite<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    dtoTypeName: string;
    location: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeWriteEvent> {
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
    kinds: ["prismaSchemas", "interfaceSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeRealizeCollectorWriteApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "realizeWrite",
      controller: createController({
        model: ctx.model,
        dtoTypeName: props.dtoTypeName,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeCollectorWriteHistories({
        state: ctx.state(),
        dtoTypeName: props.dtoTypeName,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      const event: AutoBeRealizeWriteEvent = {
        id: v7(),
        type: "realizeWrite",
        function: {
          kind: "collector",
          dtoTypeName: props.dtoTypeName,
          location: props.location,
          content: pointer.value.revise.final ?? pointer.value.draft,
        },
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      };
      ctx.dispatch(event);
      return out(result)(event);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  dtoTypeName: string;
  build: (next: IAutoBeRealizeCollectorWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete") {
      return result;
    }
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: `${props.dtoTypeName}Collector`,
      draft: result.data.request.draft,
      revise: result.data.request.revise,
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
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeRealizeCollectorWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeCollectorWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
