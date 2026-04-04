import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer, Singleton } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeSectionReviewHistory } from "./histories/transformAnalyzeSectionReviewHistory";
import {
  IAutoBeAnalyzeSectionReviewApplication,
  IAutoBeAnalyzeSectionReviewApplicationComplete,
  IAutoBeAnalyzeSectionReviewApplicationProps,
} from "./structures/IAutoBeAnalyzeSectionReviewApplication";

/**
 * Orchestrate per-module review of section content for a SINGLE module.
 *
 * This function reviews one module's section content in a single LLM call,
 * validating EARS format, value consistency, prohibited content, bridge block
 * completeness, and intra-module deduplication. Sibling modules are included as
 * lightweight title-only context for intra-file consistency reference.
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
    file: AutoBeAnalyze.IFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleSectionEvents: AutoBeAnalyzeWriteSectionEvent[];
    siblingModuleSummaries: Array<{
      moduleIndex: number;
      title: string;
      sectionTitles: string[];
    }>;
    feedback?: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeSectionReviewEvent> => {
  const counter = new Singleton(() => ++props.progress.completed);
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeSectionReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
      state: ctx.state(),
      dispatch: (e) => ctx.dispatch(e),
    });
  const event: AutoBeAnalyzeSectionReviewEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeAnalyzeSectionReviewApplicationComplete | null> =
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
          moduleIndex: props.moduleIndex,
          unitEvent: props.unitEvent,
          moduleSectionEvents: props.moduleSectionEvents,
          siblingModuleSummaries: props.siblingModuleSummaries,
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
        completed: counter.get(),
        retry: props.retry,
        created_at: new Date().toISOString(),
      };
      return out(result)(event);
    },
  );
  ctx.dispatch(event);
  return event;
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeSectionReviewApplicationComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeSectionReviewApplicationProps> => {
    const result: IValidation<IAutoBeAnalyzeSectionReviewApplicationProps> =
      typia.validate<IAutoBeAnalyzeSectionReviewApplicationProps>(input);
    if (result.success === false || result.data.request.type === "write")
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
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeSectionReviewApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
