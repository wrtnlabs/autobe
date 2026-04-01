import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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

  const cyclinic = new AutoBeCyclinicController<
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
  >({
    application:
      typia.json.application<IAutoBeDatabaseSchemaReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "previousAnalysisSections",
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

  return cyclinic.orchestrate<
    IAutoBeDatabaseSchemaReviewApplication.IWrite,
    AutoBeDatabaseSchemaReviewEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseSchemaReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          action,
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
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      if (writeData.content !== null)
        AutoBeDatabaseSchemaProgrammer.validate({
          path: "$input.request.content",
          errors,
          targetTable: props.model.name,
          otherTables: props.otherModels.map((m) => m.name),
          definition: writeData.content,
        });
      if (errors.length !== 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const event: AutoBeDatabaseSchemaReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: start.toISOString(),
        namespace: props.component.namespace,
        review: lastWrite.review,
        plan: lastWrite.plan,
        modelName: props.model.name,
        content: lastWrite.content,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        metric: result?.metric ?? {
          attempt: 0,
          success: 0,
          consent: 0,
          validationFailure: 0,
          invalidJson: 0,
        },
        tokenUsage: result?.tokenUsage ?? {
          total: 0,
          input: { total: 0, cached: 0 },
          output: {
            total: 0,
            reasoning: 0,
            accepted_prediction: 0,
            rejected_prediction: 0,
          },
        },
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().analyze?.step ?? 0,
      };
      if (result !== null) ctx.dispatch(event);
      return event;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseSchemaReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  targetComponent: AutoBeDatabaseComponent;
  model: AutoBeDatabase.IModel;
  otherModels: AutoBeDatabase.IModel[];
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    | "analysisSections"
    | "previousAnalysisSections"
    | "databaseSchemas"
    | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseSchemaReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseSchemaReviewApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeDatabaseSchemaReviewApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.action.value = { type: "write", data: next.request };
        else if (next.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeDatabaseSchemaReviewApplication,
  };
}

const SOURCE = "databaseSchemaReview" satisfies AutoBeEventSource;
