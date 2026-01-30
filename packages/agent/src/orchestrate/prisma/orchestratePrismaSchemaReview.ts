import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaReviewEvent,
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
import { transformPrismaSchemaReviewHistory } from "./histories/transformPrismaSchemaReviewHistory";
import { AutoBeDatabaseSchemaProgrammer } from "./programmers/AutoBeDatabaseSchemaProgrammer";
import { IAutoBeDatabaseSchemaReviewApplication } from "./structures/IAutoBeDatabaseSchemaReviewApplication";

export async function orchestratePrismaSchemaReview(
  ctx: AutoBeContext,
  props: {
    application: AutoBeDatabase.IApplication;
    components: AutoBeDatabaseComponent[];
    reviewed: Set<string>;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeDatabaseSchemaReviewEvent[]> {
  // Flatten into individual model tasks, skipping already-reviewed models
  const tableTasks: Array<{
    component: AutoBeDatabaseComponent;
    table: string;
    model: AutoBeDatabase.IModel;
  }> = props.components.flatMap((component) => {
    const file: AutoBeDatabase.IFile | undefined = props.application.files.find(
      (f) => f.namespace === component.namespace,
    );
    if (file === undefined) return [];
    return file.models
      .filter((m) => !props.reviewed.has(m.name))
      .map((model) => ({ component, table: model.name, model }));
  });
  if (tableTasks.length === 0) return [];

  props.progress.total += tableTasks.length;

  return (
    await executeCachedBatch(
      ctx,
      tableTasks.map((task) => async (promptCacheKey) => {
        try {
          return await step(ctx, {
            application: props.application,
            component: task.component,
            model: task.model,
            otherModels: props.application.files
              .flatMap((f) => f.models)
              .filter((m) => m.name !== task.model.name),
            progress: props.progress,
            promptCacheKey,
          });
        } catch {
          ++props.progress.completed;
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
    component: AutoBeDatabaseComponent;
    model: AutoBeDatabase.IModel;
    otherModels: AutoBeDatabase.IModel[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseSchemaReviewEvent> {
  const start: Date = new Date();
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseSchemaReviewApplication>(),
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
      database: "ast",
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseSchemaReviewApplication.IComplete | null> =
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
        targetComponent: props.component,
        model: props.model,
        otherModels: props.otherModels,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaSchemaReviewHistory({
        component: props.component,
        model: props.model,
        otherModels: props.otherModels,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeDatabaseSchemaReviewEvent = {
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
  build: (next: IAutoBeDatabaseSchemaReviewApplication.IComplete) => void;
  targetComponent: AutoBeDatabaseComponent;
  model: AutoBeDatabase.IModel;
  otherModels: AutoBeDatabase.IModel[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseSchemaReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseSchemaReviewApplication.IProps>(input);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });
    else if (result.data.request.content === null) return result;
    else if (
      result.data.request.content !== null &&
      result.data.request.content.length === 0
    )
      result.data.request.content = null;

    const errors: IValidation.IError[] = [];
    if (result.data.request.content !== null)
      AutoBeDatabaseSchemaProgrammer.validate({
        path: "$input.request.content",
        errors,
        targetTable: props.model.name,
        otherTables: props.otherModels.map((m) => m.name),
        models: result.data.request.content,
      });

    if (errors.length !== 0)
      return {
        success: false,
        data: result.data,
        errors,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseSchemaReviewApplication>({
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
    } satisfies IAutoBeDatabaseSchemaReviewApplication,
  };
}

const SOURCE = "databaseSchemaReview" satisfies AutoBeEventSource;
