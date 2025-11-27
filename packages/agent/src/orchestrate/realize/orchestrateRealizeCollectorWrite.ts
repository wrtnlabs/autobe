import {
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorPlan,
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformRealizeCollectorWriteHistories } from "./histories/transformRealizeCollectorWriteHistories";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

export async function orchestrateRealizeCollectorWrite<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    plans: AutoBeRealizeCollectorPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeWriteEvent[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector write without interface.");

  props.progress.total += props.plans.length;
  const result: AutoBeRealizeWriteEvent[] = await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        process(ctx, {
          document: history.document,
          progress: props.progress,
          neighbors: props.plans.filter((y) => x !== y),
          plan: x,
          promptCacheKey,
        }),
    ),
  );
  return result;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeWriteEvent> {
  const dtoTypeName: string = props.plan.dtoTypeName;
  const prismaSchemaName: string = props.plan.prismaSchemaName;
  const location: string = `src/collectors/${AutoBeRealizeCollectorProgrammer.getName(dtoTypeName)}.ts`;
  const preliminary: AutoBePreliminaryController<
    "prismaSchemas" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
    kinds: ["prismaSchemas", "interfaceSchemas"],
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
        plan: props.plan,
        neighbors: props.neighbors,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformRealizeCollectorWriteHistories({
        state: ctx.state(),
        plan: props.plan,
        neighbors: props.neighbors,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const content: string =
      await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
        dtoTypeName,
        schemas: props.document.components.schemas,
        code: pointer.value.revise.final ?? pointer.value.draft,
      });
    const event: AutoBeRealizeWriteEvent = {
      id: v7(),
      type: "realizeWrite",
      function: {
        kind: "collector",
        dtoTypeName,
        prismaSchemaName,
        location,
        content,
        neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(content),
        references: props.plan.references,
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
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  plan: AutoBeRealizeCollectorPlan;
  neighbors: AutoBeRealizeCollectorPlan[];
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
    const errors: IValidation.IError[] =
      AutoBeRealizeCollectorProgrammer.validate({
        plan: props.plan,
        neighbors: props.neighbors,
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
