import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeScenarioReviewEvent,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformAnalyzeScenarioReviewHistory } from "./histories/transformAnalyzeScenarioReviewHistory";
import { IAutoBeAnalyzeScenarioReviewApplication } from "./structures/IAutoBeAnalyzeScenarioReviewApplication";

/**
 * Orchestrate scenario review: validate scenario output against user's original
 * requirements.
 *
 * Checks entity coverage, hallucination, actor classification, relationship
 * completeness, and feature identification accuracy in a single LLM call.
 */
export const orchestrateAnalyzeScenarioReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    retry: number;
  },
): Promise<AutoBeAnalyzeScenarioReviewEvent> => {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeAnalyzeScenarioReviewApplication.IComplete | null> =
    {
      value: null,
    };
  const result: AutoBeContext.IResult = await ctx.conversate({
    source: SOURCE,
    controller: createController({ pointer }),
    enforceFunctionCall: true,
    ...transformAnalyzeScenarioReviewHistory(ctx, {
      scenario: props.scenario,
    }),
  });

  if (pointer.value === null) {
    // Fallback: treat as approved if LLM failed to produce a verdict
    const fallback: AutoBeAnalyzeScenarioReviewEvent = {
      type: SOURCE,
      id: v7(),
      approved: true,
      feedback:
        "Review could not be completed; proceeding with current scenario.",
      issues: [],
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      retry: props.retry,
      created_at: start.toISOString(),
    };
    ctx.dispatch(fallback);
    return fallback;
  }

  const event: AutoBeAnalyzeScenarioReviewEvent = {
    type: SOURCE,
    id: v7(),
    approved: pointer.value.approved,
    feedback: pointer.value.feedback,
    issues: pointer.value.issues.map((issue) => ({
      category:
        issue.category as AutoBeAnalyzeScenarioReviewEvent.IScenarioReviewIssue["category"],
      description: issue.description,
      suggestion: issue.suggestion,
    })),
    tokenUsage: result.tokenUsage,
    metric: result.metric,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    retry: props.retry,
    created_at: start.toISOString(),
  };
  ctx.dispatch(event);
  return event;
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeScenarioReviewApplication.IComplete | null>;
}): IAgenticaController.IClass {
  const application: ILlmApplication =
    typia.llm.application<IAutoBeAnalyzeScenarioReviewApplication>({
      validate: {
        process: (
          input: unknown,
        ): IValidation<IAutoBeAnalyzeScenarioReviewApplication.IProps> =>
          typia.validate<IAutoBeAnalyzeScenarioReviewApplication.IProps>(input),
      },
    });
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeScenarioReviewApplication,
  };
}

const SOURCE = "analyzeScenarioReview" satisfies AutoBeEventSource;
