import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeDatabaseComponentTableRevise,
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
  const allTableNames: string[] = props.components.flatMap((c) =>
    c.tables.map((t) => t.name),
  );

  return await executeCachedBatch(
    ctx,
    props.components.map((component) => async (promptCacheKey) => {
      const otherTableNames: Set<string> = new Set(
        props.components
          .filter((c) => c.filename !== component.filename)
          .flatMap((c) => c.tables.map((t) => t.name)),
      );

      const event: AutoBeDatabaseComponentReviewEvent = await process(ctx, {
        component,
        otherTableNames,
        allTableNames,
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
    otherTableNames: Set<string>;
    allTableNames: string[];
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
        otherTableNames: props.otherTableNames,
        build: (next) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaComponentReviewHistory({
        component: props.component,
        allTableNames: props.allTableNames,
        instruction: props.instruction,
        prefix: props.prefix,
        preliminary,
      }),
    });

    if (pointer.value === null) return out(result)(null);

    // Apply revises to the component's tables
    const tableMap = new Map<string, AutoBeDatabase.ITableDesign>(
      props.component.tables.map((t) => [t.name, t]),
    );

    const revises: AutoBeDatabaseComponentTableRevise[] = [];
    for (const revise of pointer.value.revises) {
      if (revise.type === "create") {
        // Only add if not in other components
        if (!props.otherTableNames.has(revise.table)) {
          tableMap.set(revise.table, {
            name: revise.table,
            description: revise.description,
          });
          revises.push(revise);
        }
      } else if (revise.type === "update") {
        // Remove original, add updated (if not in other components)
        tableMap.delete(revise.original);
        if (!props.otherTableNames.has(revise.updated)) {
          tableMap.set(revise.updated, {
            name: revise.updated,
            description: revise.description,
          });
          revises.push(revise);
        }
      } else if (revise.type === "erase") {
        tableMap.delete(revise.table);
        revises.push(revise);
      } else {
        revise satisfies never;
      }
    }

    const validTables: AutoBeDatabase.ITableDesign[] = Array.from(
      tableMap.values(),
    );

    const component: AutoBeDatabase.IComponent = {
      filename: props.component.filename,
      namespace: props.component.namespace,
      thinking: props.component.thinking,
      review: pointer.value.review,
      rationale: props.component.rationale,
      tables: validTables,
    };

    return out(result)({
      type: SOURCE,
      id: v7(),
      created_at: props.start.toISOString(),
      review: component.review,
      revises,
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
  otherTableNames: Set<string>;
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
