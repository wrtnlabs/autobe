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
import { transformAnalyzeSectionCrossFileReviewHistory } from "./histories/transformAnalyzeSectionCrossFileReviewHistory";
import { IAutoBeAnalyzeSectionCrossFileReviewApplication } from "./structures/IAutoBeAnalyzeSectionCrossFileReviewApplication";

/**
 * Orchestrate cross-file lightweight review of section metadata across ALL
 * files.
 *
 * This function reviews all files' section metadata (titles, keywords,
 * purposes) together in a single LLM call, providing cross-file validation for
 * terminology alignment, value consistency, naming conventions, and content
 * deduplication.
 *
 * Unlike the per-file review which checks full content, this review only
 * receives lightweight metadata to stay within context limits.
 */
export const orchestrateAnalyzeSectionCrossFileReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileSummaries: Array<{
      file: AutoBeAnalyze.IFileScenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      unitEvents: AutoBeAnalyzeWriteUnitEvent[];
      sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
      status: "approved" | "rewritten" | "new";
    }>;
    mechanicalViolationSummary?: string;
    fileDecisions?: import("./utils/detectDecisionConflicts").IFileDecisions[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeSectionReviewEvent> => {
  const preliminary: AutoBePreliminaryController<
    "previousAnalysisSections" | "complete"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeAnalyzeSectionCrossFileReviewApplication>(),
    source: SOURCE,
    kinds: ["previousAnalysisSections", "complete"],
    state: ctx.state(),
    dispatch: (e) => ctx.dispatch(e),
  });
  const counter = new Singleton(() => ++props.progress.completed);
  const event: AutoBeAnalyzeSectionReviewEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeAnalyzeSectionCrossFileReviewApplication.IWrite | null> =
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
        ...transformAnalyzeSectionCrossFileReviewHistory(ctx, {
          scenario: props.scenario,
          allFileSummaries: props.allFileSummaries,
          mechanicalViolationSummary: props.mechanicalViolationSummary,
          fileDecisions: props.fileDecisions,
          preliminary,
        }),
      });
      if (pointer.value === null) return out(result)(null);

      const event: AutoBeAnalyzeSectionReviewEvent = {
        type: SOURCE,
        id: v7(),
        fileResults: pointer.value.fileResults.map((fr) => ({
          ...fr,
          revisedSections: null,
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
  pointer: IPointer<IAutoBeAnalyzeSectionCrossFileReviewApplication.IWrite | null>;
  preliminary: AutoBePreliminaryController<
    "previousAnalysisSections" | "complete"
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeSectionCrossFileReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeSectionCrossFileReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeSectionCrossFileReviewApplication.IProps>(
        input,
      );
    if (result.success === false || result.data.request.type === "write")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeSectionCrossFileReviewApplication>({
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
    } satisfies IAutoBeAnalyzeSectionCrossFileReviewApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
