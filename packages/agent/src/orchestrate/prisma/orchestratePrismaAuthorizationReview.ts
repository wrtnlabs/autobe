import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseAuthorizationReviewEvent,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseComponentTableRevise,
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
import { transformPrismaAuthorizationReviewHistory } from "./histories/transformPrismaAuthorizationReviewHistory";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { AutoBeDatabaseComponentReviewProgrammer } from "./programmers/AutoBeDatabaseComponentReviewProgrammer";
import { IAutoBeDatabaseAuthorizationReviewApplication } from "./structures/IAutoBeDatabaseAuthorizationReviewApplication";

export async function orchestratePrismaAuthorizationReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabaseComponent[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const allTableNames: string[] = props.components.flatMap((c) =>
    c.tables.map((t) => t.name),
  );
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.components.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    props.components.map((component) => async (promptCacheKey) => {
      const otherTableNames: Set<string> = new Set(
        props.components
          .filter((c) => c.filename !== component.filename)
          .flatMap((c) => c.tables.map((t) => t.name)),
      );

      const event: AutoBeDatabaseAuthorizationReviewEvent = await process(ctx, {
        component,
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

    // Apply revises to the component's tables
    const tableMap = new Map<string, AutoBeDatabaseComponentTableDesign>(
      props.component.tables.map((t) => [t.name, t]),
    );

    const revises: AutoBeDatabaseComponentTableRevise[] = [];
    for (const r of pointer.value.revises) {
      if (r.type === "create") {
        // Only add if not in other components
        tableMap.set(r.table, {
          name: r.table,
          description: r.description,
        });
        revises.push(r);
      } else if (r.type === "update") {
        // Remove original, add updated (if not in other components)
        tableMap.delete(r.original);
        tableMap.set(r.updated, {
          name: r.updated,
          description: r.description,
        });
        revises.push(r);
      } else if (r.type === "erase") {
        tableMap.delete(r.table);
        revises.push(r);
      } else {
        r satisfies never;
      }
    }

    const validTables: AutoBeDatabaseComponentTableDesign[] = Array.from(
      tableMap.values(),
    );

    const component: AutoBeDatabaseComponent = {
      kind: props.component.kind,
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
      created_at: new Date().toISOString(),
      review: component.review,
      revises,
      modification: component,
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
  build: (
    next: IAutoBeDatabaseAuthorizationReviewApplication.IComplete,
  ) => void;
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
    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      prefix: props.prefix,
      revises: result.data.request.revises,
      path: "$input.request.revises",
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
