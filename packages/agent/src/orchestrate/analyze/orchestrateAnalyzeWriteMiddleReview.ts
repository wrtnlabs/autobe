import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeAnalyzeWriteMiddleReviewEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteMiddleReviewHistories } from "./histories/transformAnalyzeWriteMiddleReviewHistories";
import { IAutoBeAnalyzeWriteMiddleReviewApplication } from "./structures/IAutoBeAnalyzeWriteMiddleReviewApplication";

export const orchestrateAnalyzeWriteMiddleReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    middleEvent: AutoBeAnalyzeWriteMiddleEvent;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteMiddleReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteMiddleReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteMiddleReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformAnalyzeWriteMiddleReviewHistories(ctx, {
        scenario: props.scenario,
        file: props.file,
        majorEvent: props.majorEvent,
        middleEvent: props.middleEvent,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteMiddleReviewEvent = {
      type: SOURCE,
      id: v7(),
      majorIndex: pointer.value.majorIndex,
      approved: pointer.value.approved,
      feedback: pointer.value.feedback,
      revisedSections: pointer.value.revisedSections,
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: props.progress.completed,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeWriteMiddleReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteMiddleReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteMiddleReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteMiddleReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteMiddleReviewApplication>({
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
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeWriteMiddleReviewApplication,
  };
}

const SOURCE = "analyzeWriteMiddleReview" satisfies AutoBeEventSource;
