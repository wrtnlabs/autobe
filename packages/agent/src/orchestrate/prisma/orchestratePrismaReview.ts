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

async function step(
  ctx: AutoBeContext,
  props: {
    application: AutoBeDatabase.IApplication;
    component: AutoBeDatabase.IComponent;
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
      databaseSchemas: ((): AutoBeDatabase.IModel[] => {
        const file: AutoBeDatabase.IFile | undefined =
          props.application.files.find(
            (f) => f.filename === props.component.filename,
          );
        if (file === undefined) return [];
        return props.component.tables
          .map((table) => file.models.find((m) => m.name === table))
          .filter((m) => m !== undefined);
      })(),
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
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      const event: AutoBeDatabaseReviewEvent = {
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
