import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseAuthorizationReviewEvent,
  AutoBeDatabaseComponent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaAuthorizationReviewHistory } from "./histories/transformPrismaAuthorizationReviewHistory";
import { AutoBeDatabaseAuthorizationReviewProgrammer } from "./programmers/AutoBeDatabaseAuthorizationReviewProgrammer";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { AutoBeDatabaseComponentReviewProgrammer } from "./programmers/AutoBeDatabaseComponentReviewProgrammer";
import { IAutoBeDatabaseAuthorizationReviewApplication } from "./structures/IAutoBeDatabaseAuthorizationReviewApplication";

export async function orchestratePrismaAuthorizationReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    pairs: Pair<AutoBeAnalyzeActor, AutoBeDatabaseComponent>[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const allTableNames: string[] = props.pairs.flatMap((c) =>
    c.second.tables.map((t) => t.name),
  );
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.pairs.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    props.pairs.map((x) => async (promptCacheKey) => {
      const otherTableNames: Set<string> = new Set(
        props.pairs
          .filter((y) => y.second.filename !== x.second.filename)
          .flatMap((y) => y.second.tables.map((t) => t.name)),
      );
      const event: AutoBeDatabaseAuthorizationReviewEvent = await process(ctx, {
        component: x.second,
        actor: x.first,
        otherTableNames,
        allTableNames,
        instruction: props.instruction,
        prefix,
        progress,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return event.modification;
    }),
  );
  return AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);
}

async function process(
  ctx: AutoBeContext,
  props: {
    actor: AutoBeAnalyzeActor;
    component: AutoBeDatabaseComponent;
    otherTableNames: Set<string>;
    allTableNames: string[];
    instruction: string;
    prefix: string | null;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseAuthorizationReviewEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseAuthorizationReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseAuthorizationReviewApplication.IComplete | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        prefix: props.prefix,
        actor: props.actor,
        component: props.component,
        otherTableNames: props.otherTableNames,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaAuthorizationReviewHistory({
        component: props.component,
        allTableNames: props.allTableNames,
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const modification: AutoBeDatabaseComponent = {
      kind: props.component.kind,
      filename: props.component.filename,
      namespace: props.component.namespace,
      thinking: props.component.thinking,
      review: pointer.value.review,
      rationale: props.component.rationale,
      tables: AutoBeDatabaseComponentReviewProgrammer.execute({
        component: props.component,
        revises: pointer.value.revises,
      }),
    };
    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      review: modification.review,
      revises: pointer.value.revises,
      modification,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().analyze?.step ?? 0,
    });
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  prefix: string | null;
  otherTableNames: Set<string>;
  component: AutoBeDatabaseComponent;
  build: (
    next: IAutoBeDatabaseAuthorizationReviewApplication.IComplete,
  ) => void;
  actor: AutoBeAnalyzeActor;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseAuthorizationReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseAuthorizationReviewApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseAuthorizationReviewProgrammer.validate({
      errors,
      prefix: props.prefix,
      revises: result.data.request.revises,
      path: "$input.request.revises",
      component: props.component,
      actor: props.actor,
    });
    if (errors.length > 0)
      return {
        success: false,
        data: result.data,
        errors,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseAuthorizationReviewApplication>({
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
    } satisfies IAutoBeDatabaseAuthorizationReviewApplication,
  };
}

const SOURCE = "databaseAuthorizationReview" satisfies AutoBeEventSource;
