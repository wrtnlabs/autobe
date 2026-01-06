import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaComponentReviewHistory } from "./histories/transformPrismaComponentReviewHistory";
import { IAutoBeDatabaseComponentReviewApplication } from "./structures/IAutoBeDatabaseComponentReviewApplication";

export async function orchestratePrismaComponentReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabase.IComponent[];
  },
): Promise<AutoBeDatabaseComponentReviewEvent[]> {
  const start: Date = new Date();
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const total: number = props.components.length;
  const completed: IPointer<number> = { value: 0 };
  const allTables: string[] = props.components.flatMap((c) => c.tables);

  return await executeCachedBatch(
    ctx,
    props.components.map((component) => async (promptCacheKey) => {
      const otherTables: Set<string> = new Set(
        props.components
          .filter((c) => c.filename !== component.filename)
          .flatMap((c) => c.tables),
      );

      const event: AutoBeDatabaseComponentReviewEvent = await process(ctx, {
        component,
        otherTables,
        allTables,
        instruction: props.instruction,
        prefix,
        start,
        total,
        completed,
        promptCacheKey,
      });
      ctx.dispatch(event);
      return event;
    }),
  );
}

async function process(
  ctx: AutoBeContext,
  props: {
    component: AutoBeDatabase.IComponent;
    otherTables: Set<string>;
    allTables: string[];
    instruction: string;
    prefix: string | null;
    start: Date;
    total: number;
    completed: IPointer<number>;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseComponentReviewEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeDatabaseComponentReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
    all: {
      analysisFiles: ctx.state().analyze?.files ?? [],
    },
    local: {
      analysisFiles: [],
    },
  });

  return preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseComponentReviewApplication.IComplete | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        otherTables: props.otherTables,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaComponentReviewHistory({
        component: props.component,
        allTables: props.allTables,
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
      }),
    });

    if (pointer.value === null) return out(result)(null);

    const validTables: string[] = pointer.value.tables.filter(
      (t) => props.otherTables.has(t) === false,
    );

    const component: AutoBeDatabase.IComponent = {
      filename: props.component.filename,
      namespace: props.component.namespace,
      thinking: props.component.thinking,
      review: pointer.value.review,
      rationale: pointer.value.plan,
      tables: validTables,
    };

    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: props.start.toISOString(),
      review: component.review,
      plan: component.rationale,
      modification: component,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.completed.value,
      total: props.total,
      step: ctx.state().analyze?.step ?? 0,
    });
  });
}

function createController(props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  otherTables: Set<string>;
  build: (next: IAutoBeDatabaseComponentReviewApplication.IComplete) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentReviewApplication.IProps>(input);
    if (result.success === false) return result;

    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeDatabaseComponentReviewApplication>({
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
    } satisfies IAutoBeDatabaseComponentReviewApplication,
  };
}

const SOURCE = "databaseComponentReview" satisfies AutoBeEventSource;
