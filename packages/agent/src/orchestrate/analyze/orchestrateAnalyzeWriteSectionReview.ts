import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteSectionReviewEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteSectionReviewHistory } from "./histories/transformAnalyzeWriteSectionReviewHistory";
import { IAutoBeAnalyzeWriteSectionReviewApplication } from "./structures/IAutoBeAnalyzeWriteSectionReviewApplication";

export const orchestrateAnalyzeWriteSectionReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    sectionEvent: AutoBeAnalyzeWriteSectionEvent;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteSectionReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteSectionReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteSectionReviewApplication.IComplete | null> =
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
      ...transformAnalyzeWriteSectionReviewHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvent: props.unitEvent,
        sectionEvent: props.sectionEvent,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteSectionReviewEvent = {
      type: SOURCE,
      id: v7(),
      moduleIndex: pointer.value.moduleIndex,
      unitIndex: pointer.value.unitIndex,
      approved: pointer.value.approved,
      feedback: pointer.value.feedback,
      revisedSections: pointer.value.revisedSections,
      acquisition: preliminary.getAcquisition(),
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
  pointer: IPointer<IAutoBeAnalyzeWriteSectionReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteSectionReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteSectionReviewApplication>({
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
    } satisfies IAutoBeAnalyzeWriteSectionReviewApplication,
  };
}

const SOURCE = "analyzeWriteSectionReview" satisfies AutoBeEventSource;
