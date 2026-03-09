import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeScenarioReviewEvent,
  AutoBeAnalyzeScenarioReviewIssue,
  AutoBeEventSource,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformAnalyzeScenarioReviewHistory } from "./histories/transformAnalyzeScenarioReviewHistory";
import {
  IAutoBeAnalyzeScenarioReviewApplication,
  IAutoBeAnalyzeScenarioReviewApplicationComplete,
  IAutoBeAnalyzeScenarioReviewApplicationProps,
} from "./structures/IAutoBeAnalyzeScenarioReviewApplication";
import { isRecord, tryParseStringAsRecord } from "./utils/repairUtils";

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
  const pointer: IPointer<IAutoBeAnalyzeScenarioReviewApplicationComplete | null> =
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
      category: issue.category as AutoBeAnalyzeScenarioReviewIssue["category"],
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
  pointer: IPointer<IAutoBeAnalyzeScenarioReviewApplicationComplete | null>;
}): IAgenticaController.IClass {
  const application: ILlmApplication =
    typia.llm.application<IAutoBeAnalyzeScenarioReviewApplication>({
      validate: {
        process: (
          input: unknown,
        ): IValidation<IAutoBeAnalyzeScenarioReviewApplicationProps> => {
          if (isRecord(input) && typeof input.request === "string") {
            input = {
              ...input,
              request: tryParseStringAsRecord(input.request),
            };
          }
          return typia.validate<IAutoBeAnalyzeScenarioReviewApplicationProps>(
            input,
          );
        },
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
