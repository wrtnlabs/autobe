import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
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
import { transformAnalyzeSectionReviewHistory } from "./histories/transformAnalyzeSectionReviewHistory";
import { IAutoBeAnalyzeSectionReviewApplication } from "./structures/IAutoBeAnalyzeSectionReviewApplication";

/**
 * Orchestrate per-file review of section content for a SINGLE file.
 *
 * This function reviews one file's section content in a single LLM call,
 * validating EARS format, value consistency, prohibited content, bridge block
 * completeness, and intra-file deduplication.
 *
 * For cross-file consistency checks (terminology alignment, value consistency
 * across files, naming conventions), use
 * orchestrateAnalyzeSectionCrossFileReview.
 */
export const orchestrateAnalyzeSectionReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileIndex: number;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
    feedback?: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeSectionReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeSectionReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeSectionReviewApplication.IComplete | null> =
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
      ...transformAnalyzeSectionReviewHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvents: props.unitEvents,
        sectionEvents: props.sectionEvents,
        feedback: props.feedback,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Map LLM's fileIndex (always 0 for single file) to actual fileIndex
    const event: AutoBeAnalyzeSectionReviewEvent = {
      type: SOURCE,
      id: v7(),
      fileResults: pointer.value.fileResults.map((fr) => ({
        ...fr,
        fileIndex: props.fileIndex,
        rejectedModuleUnits: fr.rejectedModuleUnits ?? null,
      })),
      acquisition: preliminary.getAcquisition(),
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: ++props.progress.completed,
      retry: props.retry,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeSectionReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeSectionReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeSectionReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeSectionReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeSectionReviewApplication>({
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
    } satisfies IAutoBeAnalyzeSectionReviewApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
