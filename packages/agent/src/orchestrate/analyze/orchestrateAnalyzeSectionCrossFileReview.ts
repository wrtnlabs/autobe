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
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeSectionCrossFileReviewHistory } from "./histories/transformAnalyzeSectionCrossFileReviewHistory";
import {
  IAutoBeAnalyzeSectionCrossFileReviewApplication,
  IAutoBeAnalyzeSectionCrossFileReviewApplicationProps,
  IAutoBeAnalyzeSectionCrossFileReviewApplicationWrite,
} from "./structures/IAutoBeAnalyzeSectionCrossFileReviewApplication";
import { repairSectionReviewInput } from "./utils/repairSectionReviewUtils";

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
  const cyclinic = new AutoBeCyclinicController<"previousAnalysisSections">({
    application:
      typia.json.application<IAutoBeAnalyzeSectionCrossFileReviewApplication>(),
    source: SOURCE,
    kinds: ["previousAnalysisSections"],
    state: ctx.state(),
  });

  return cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeAnalyzeSectionCrossFileReviewApplicationWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({ cyclinic, action }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformAnalyzeSectionCrossFileReviewHistory(ctx, {
          scenario: props.scenario,
          allFileSummaries: props.allFileSummaries,
          mechanicalViolationSummary: props.mechanicalViolationSummary,
          fileDecisions: props.fileDecisions,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: no external compilation — always succeeds
    async (_writeData) => {
      return { success: true };
    },
    // FINALIZE: build review event, dispatch, return
    async (lastWrite, result) => {
      const event: AutoBeAnalyzeSectionReviewEvent = {
        type: SOURCE,
        id: v7(),
        fileResults: lastWrite.fileResults.map((fr) => ({
          ...fr,
          revisedSections: null,
          rejectedModuleUnits: fr.rejectedModuleUnits ?? null,
        })),
        acquisition: cyclinic.getPreliminary().getAcquisition(),
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
        metric: result?.metric ?? {
          attempt: 0,
          success: 0,
          consent: 0,
          validationFailure: 0,
          invalidJson: 0,
        },
        step: (ctx.state().analyze?.step ?? -1) + 1,
        total: props.progress.total,
        completed: ++props.progress.completed,
        retry: props.retry,
        created_at: new Date().toISOString(),
      };
      if (result !== null) ctx.dispatch(event);
      return event;
    },
  );
};

function createController(props: {
  cyclinic: AutoBeCyclinicController<"previousAnalysisSections">;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeAnalyzeSectionCrossFileReviewApplicationWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    props.cyclinic.getPreliminary();
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeSectionCrossFileReviewApplicationProps> => {
    input = repairSectionReviewInput(input);
    const result: IValidation<IAutoBeAnalyzeSectionCrossFileReviewApplicationProps> =
      typia.validate<IAutoBeAnalyzeSectionCrossFileReviewApplicationProps>(
        input,
      );
    if (result.success === false) return result;
    if (
      result.data.request.type === "write" ||
      result.data.request.type === "complete"
    )
      return result;
    return preliminary.validate({
      thinking: result.data.thinking ?? "",
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeAnalyzeSectionCrossFileReviewApplication>({
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
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeAnalyzeSectionCrossFileReviewApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
