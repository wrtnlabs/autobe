import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
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
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeTransformerWriteHistories } from "./histories/transformRealizeTransformerWriteHistories";
import { IAutoBeRealizeTransformerWriteApplication } from "./structures/IAutoBeRealizeTransformerWriteApplication";

export async function orchestrateRealizeTransformerWrite<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeRealizeWriteEvent[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const candidates: string[] = Object.keys(document.components.schemas).filter(
    (key) =>
      key.startsWith("IPage") === false &&
      key !== "IAuthorizationToken" &&
      key.endsWith(".ICreate") === false &&
      key.endsWith(".IUpdate") === false,
  );
  const progress: AutoBeProgressEventBase = {
    total: candidates.length,
    completed: 0,
  };
  const result: Array<AutoBeRealizeWriteEvent | string> =
    await executeCachedBatch(
      ctx,
      candidates.map(
        (dtoTypeName) => (promptCacheKey) =>
          process(ctx, {
            dtoTypeName,
            promptCacheKey,
            progress,
          }),
      ),
    );
  return result.filter((r) => typeof r === "object");
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dtoTypeName: string;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeWriteEvent | string> {
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeTransformerWriteApplication>(),
    kinds: ["prismaSchemas", "interfaceSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<
      | IAutoBeRealizeTransformerWriteApplication.IComplete
      | IAutoBeRealizeTransformerWriteApplication.IReject
      | null
    > = {
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
      ...transformRealizeTransformerWriteHistories({
        state: ctx.state(),
        dtoTypeName: props.dtoTypeName,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      if (pointer.value.type === "reject")
        return out(result)(pointer.value.reason);
      const event: AutoBeRealizeWriteEvent = {
        id: v7(),
        type: "realizeWrite",
        function: {
          kind: "transformer",
          dtoTypeName: props.dtoTypeName,
          prismaSchemaName: pointer.value.prismaSchemaName,
          location: `src/transformers/${props.dtoTypeName.replaceAll(".", "_")}Transformer.ts`,
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
  build: (next: IAutoBeRealizeTransformerWriteApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  >;
}): ILlmController<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerWriteApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete") return result;

    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: `${props.dtoTypeName}Transformer`,
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
    } satisfies IAutoBeRealizeTransformerWriteApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "chatgpt">(
      {
        validate: {
          process: validate,
        },
      },
    ),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
