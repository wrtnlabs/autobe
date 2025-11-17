import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBePrisma,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBePrismaReviewEvent } from "@autobe/interface/src/events/AutoBePrismaReviewEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaReviewHistory } from "./histories/transformPrismaReviewHistory";
import { IAutoBePrismaReviewApplication } from "./structures/IAutoBePrismaReviewApplication";

export async function orchestratePrismaReview<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  application: AutoBePrisma.IApplication,
  componentList: AutoBePrisma.IComponent[],
): Promise<AutoBePrismaReviewEvent[]> {
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: componentList.length,
  };
  return (
    await executeCachedBatch(
      ctx,
      componentList.map((component) => async (promptCacheKey) => {
        try {
          return await step(ctx, {
            application,
            component,
            progress,
            promptCacheKey,
          });
        } catch {
          ++progress.completed;
          return null;
        }
      }),
    )
  ).filter((v) => v !== null);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    application: AutoBePrisma.IApplication;
    component: AutoBePrisma.IComponent;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBePrismaReviewEvent> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBePrismaReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
    all: {
      prismaSchemas: props.application.files.map((f) => f.models).flat(),
    },
    local: {
      prismaSchemas: ((): AutoBePrisma.IModel[] => {
        const file: AutoBePrisma.IFile | undefined =
          props.application.files.find(
            (f) => f.filename === props.component.filename,
          );
        if (file === undefined) return [];
        return props.component.tables
          .map((table) => file.models.find((m) => m.name === table))
          .filter((m) => m !== undefined);
      })(),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBePrismaReviewApplication.IComplete | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaReviewHistory({
        component: props.component,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      const event: AutoBePrismaReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: start.toISOString(),
        filename: props.component.filename,
        review: pointer.value.review,
        plan: pointer.value.plan,
        modifications: pointer.value.modifications,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
      };
      ctx.dispatch(event);
      return out(result)(event);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
    build: (next: IAutoBePrismaReviewApplication.IComplete) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(ctx.model);

  const validate = (
    input: unknown,
  ): IValidation<IAutoBePrismaReviewApplication.IProps> => {
    const result: IValidation<IAutoBePrismaReviewApplication.IProps> =
      typia.validate<IAutoBePrismaReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication<Model> = collection[
    ctx.model === "chatgpt"
      ? "chatgpt"
      : ctx.model === "gemini"
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
    } satisfies IAutoBePrismaReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaReviewApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaReviewApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBePrismaReviewApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBePrismaReviewApplication.IProps>;

const SOURCE = "prismaReview" satisfies AutoBeEventSource;
