import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeReviewHistories } from "./histories/transformAnalyzeReviewHistories";
import { IAutoBeAnalyzeReviewApplication } from "./structures/IAutoBeAnalyzeReviewApplication";

export const orchestrateAnalyzeReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFiles: AutoBeAnalyzeFile[];
    myFile: AutoBeAnalyzeFile;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeReviewEvent> => {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeAnalyzeReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "previousAnalysisFiles"],
    state: ctx.state(),
    all: {
      analysisFiles: props.allFiles,
    },
    local: {
      analysisFiles: [props.myFile],
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeReviewApplication.IComplete | null> =
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
      ...transformAnalyzeReviewHistories(ctx, {
        preliminary,
        scenario: props.scenario,
        myFile: props.myFile,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeReviewEvent = {
      type: SOURCE,
      id: v7(),
      file: props.myFile,
      plan: pointer.value.plan,
      review: pointer.value.review,
      content: pointer.value.content,
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles"
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeReviewApplication>({
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
    } satisfies IAutoBeAnalyzeReviewApplication,
  };
}

const SOURCE = "analyzeReview" satisfies AutoBeEventSource;
