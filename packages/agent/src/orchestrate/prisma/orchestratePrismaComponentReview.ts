import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentReviewEvent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformPrismaComponentReviewHistory } from "./histories/transformPrismaComponentReviewHistory";
import { AutoBeDatabaseComponentProgrammer } from "./programmers/AutoBeDatabaseComponentProgrammer";
import { AutoBeDatabaseComponentReviewProgrammer } from "./programmers/AutoBeDatabaseComponentReviewProgrammer";
import { IAutoBeDatabaseComponentReviewApplication } from "./structures/IAutoBeDatabaseComponentReviewApplication";

export async function orchestratePrismaComponentReview(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    components: AutoBeDatabaseComponent[];
  },
): Promise<AutoBeDatabaseComponent[]> {
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const progress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.components.length,
  };

  const components: AutoBeDatabaseComponent[] = await executeCachedBatch(
    ctx,
    props.components.map((component) => async (promptCacheKey) => {
      try {
        const otherTables: AutoBeDatabaseComponentTableDesign[] =
          props.components
            .filter((c) => c.filename !== component.filename)
            .flatMap((c) => c.tables);
        const event: AutoBeDatabaseComponentReviewEvent = await forceRetry(() =>
          process(ctx, {
            component,
            otherTables,
            instruction: props.instruction,
            prefix,
            progress,
            promptCacheKey,
          }),
        );
        ctx.dispatch(event);
        return event.modification;
      } catch {
        --progress.total;
        return component;
      }
    }),
  );
  return AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);
}

async function process(
  ctx: AutoBeContext,
  props: {
    component: AutoBeDatabaseComponent;
    otherTables: AutoBeDatabaseComponentTableDesign[];
    instruction: string;
    prefix: string | null;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeDatabaseComponentReviewEvent> {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = new AutoBePreliminaryController({
    dispatch: (e) => ctx.dispatch(e),
    application:
      typia.json.application<IAutoBeDatabaseComponentReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisSections",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
    ],
    state: ctx.state(),
  });

  return preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeDatabaseComponentReviewApplication.IWrite | null> =
      { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        otherTables: props.otherTables,
        prefix: props.prefix,
        build: (next) => {
          pointer.value = next;
        },
        component: props.component,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformPrismaComponentReviewHistory({
        component: props.component,
        otherTables: props.otherTables,
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
      acquisition: preliminary.getAcquisition(),
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
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  otherTables: AutoBeDatabaseComponentTableDesign[];
  prefix: string | null;
  build: (next: IAutoBeDatabaseComponentReviewApplication.IWrite) => void;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentReviewApplication.IProps>(input);
    if (result.success === false) return result;

    if (result.data.request.type !== "write")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      prefix: props.prefix,
      path: "$input.request.revises",
      revises: result.data.request.revises,
      component: props.component,
      otherTables: props.otherTables,
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
        if (next.request.type === "write") props.build(next.request);
      },
    } satisfies IAutoBeDatabaseComponentReviewApplication,
  };
}

const SOURCE = "databaseComponentReview" satisfies AutoBeEventSource;
