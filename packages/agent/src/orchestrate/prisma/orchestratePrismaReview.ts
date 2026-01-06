import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseReviewEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaReviewHistory } from "./histories/transformPrismaReviewHistory";
import { IAutoBeDatabaseReviewApplication } from "./structures/IAutoBeDatabaseReviewApplication";

export async function orchestratePrismaReview(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
  componentList: AutoBeDatabase.IComponent[],
): Promise<AutoBeDatabaseReviewEvent[]> {
  // Flatten component list into individual table tasks
  const tableTasks: Array<{
    component: AutoBeDatabase.IComponent;
    table: string;
    model: AutoBeDatabase.IModel;
  }> = componentList.flatMap((component) => {
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.filename === component.filename,
    );
    if (file === undefined) return [];
    return component.tables
      .map((table) => {
        const model = file.models.find((m) => m.name === table);
        if (model === undefined) return null;
        return { component, table, model };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);
  });

  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: tableTasks.length,
  };

  return (
    await executeCachedBatch(
      ctx,
      tableTasks.map((task) => async (promptCacheKey) => {
        try {
          return await step(ctx, {
            application,
            component: task.component,
            model: task.model,
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

async function step(
  ctx: AutoBeContext,
  props: {
    application: AutoBeDatabase.IApplication;
    component: AutoBeDatabase.IComponent;
    model: AutoBeDatabase.IModel;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseReviewEvent> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeDatabaseReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      databaseSchemas: props.application.files.map((f) => f.models).flat(),
    },
    local: {
      databaseSchemas: [props.model],
    },
    config: {
      prisma: "ast",
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaReviewHistory({
        component: props.component,
        model: props.model,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeDatabaseReviewEvent = {
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      namespace: props.component.namespace,
      review: pointer.value.review,
      plan: pointer.value.plan,
      modelName: props.model.name,
      content: pointer.value.content,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "previousAnalysisFiles"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
  build: (next: IAutoBeDatabaseReviewApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseReviewApplication,
  };
}

const SOURCE = "databaseReview" satisfies AutoBeEventSource;
