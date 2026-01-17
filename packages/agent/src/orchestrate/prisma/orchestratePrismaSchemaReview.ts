import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaSchemaReviewHistory } from "./histories/transformPrismaSchemaReviewHistory";
import { IAutoBeDatabaseSchemaReviewApplication } from "./structures/IAutoBeDatabaseSchemaReviewApplication";

export async function orchestratePrismaSchemaReview(
  ctx: AutoBeContext,
  application: AutoBeDatabase.IApplication,
  componentList: AutoBeDatabaseComponent[],
): Promise<AutoBeDatabaseSchemaReviewEvent[]> {
  // Flatten component list into individual table tasks
  const tableTasks: Array<{
    component: AutoBeDatabaseComponent;
    table: string;
    model: AutoBeDatabase.IModel;
  }> = componentList.flatMap((component) => {
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.namespace === component.namespace,
    );
    if (file === undefined) return [];
    return component.tables
      .map((table) => {
        const model = file.models.find((m) => m.name === table.name);
        if (model === undefined) return null;
        return { component, table: table.name, model };
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
    component: AutoBeDatabaseComponent;
    model: AutoBeDatabase.IModel;
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
        targetTable: props.model.name,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaSchemaReviewHistory({
        component: props.component,
        model: props.model,
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
  targetTable: string;
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

    const actual: AutoBeDatabase.IModel = result.data.request.content;
    const expected: string = props.targetTable;

    if (actual.name === expected) return result;
    return {
      success: false,
      data: result.data,
      errors: [
        {
          path: "$input.request.content.name",
          value: actual.name,
          expected: JSON.stringify(expected),
          description: StringUtil.trim`
            You modified a model with the wrong table name.

            You are responsible for reviewing exactly ONE table with the exact name specified.

            - filename: current domain's filename
            - namespace: current domain's namespace
            - expected table name: ${expected}
            - actual table name: ${actual.name}

            ${JSON.stringify({
              filename: props.targetComponent.filename,
              namespace: props.targetComponent.namespace,
              targetTable: expected,
              actualTableName: actual.name,
            })}
          `,
        },
      ],
    };
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
