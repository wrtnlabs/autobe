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
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >({
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

  return cyclinic.orchestrate<
    IAutoBeDatabaseComponentReviewApplication.IWrite,
    AutoBeDatabaseComponentReviewEvent
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeDatabaseComponentReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          otherTables: props.otherTables,
          prefix: props.prefix,
          action,
          component: props.component,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformPrismaComponentReviewHistory({
          component: props.component,
          otherTables: props.otherTables,
          instruction: props.instruction,
          prefix: props.prefix,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      AutoBeDatabaseComponentReviewProgrammer.validate({
        errors,
        prefix: props.prefix,
        path: "$input.request.revises",
        revises: writeData.revises,
        component: props.component,
        otherTables: props.otherTables,
      });
      if (errors.length > 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      const modification: AutoBeDatabaseComponent = {
        kind: props.component.kind,
        filename: props.component.filename,
        namespace: props.component.namespace,
        thinking: props.component.thinking,
        review: lastWrite.review,
        rationale: props.component.rationale,
        tables: AutoBeDatabaseComponentReviewProgrammer.execute({
          component: props.component,
          revises: lastWrite.revises,
        }),
      };

      const event: AutoBeDatabaseComponentReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: new Date().toISOString(),
        review: modification.review,
        revises: lastWrite.revises,
        modification,
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
      return event;
    },
  );
}

function createController(props: {
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  otherTables: AutoBeDatabaseComponentTableDesign[];
  prefix: string | null;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeDatabaseComponentReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "previousAnalysisSections" | "previousDatabaseSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    input: unknown,
  ): IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> => {
    const result: IValidation<IAutoBeDatabaseComponentReviewApplication.IProps> =
      typia.validate<IAutoBeDatabaseComponentReviewApplication.IProps>(input);
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
      typia.llm.application<IAutoBeDatabaseComponentReviewApplication>({
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
    } satisfies IAutoBeDatabaseComponentReviewApplication,
  };
}

const SOURCE = "databaseComponentReview" satisfies AutoBeEventSource;
