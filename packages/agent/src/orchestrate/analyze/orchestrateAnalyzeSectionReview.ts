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
import { transformAnalyzeSectionReviewHistory } from "./histories/transformAnalyzeSectionReviewHistory";
import {
  IAutoBeAnalyzeSectionReviewApplication,
  IAutoBeAnalyzeSectionReviewApplicationWrite,
  IAutoBeAnalyzeSectionReviewApplicationProps,
} from "./structures/IAutoBeAnalyzeSectionReviewApplication";
import { repairSectionReviewInput } from "./utils/repairSectionReviewUtils";

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
  const cyclinic = new AutoBeCyclinicController<"previousAnalysisSections">({
    application:
      typia.json.application<IAutoBeAnalyzeSectionReviewApplication>(),
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
            data: IAutoBeAnalyzeSectionReviewApplicationWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({ cyclinic, action }),
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
          fileIndex: props.fileIndex,
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
        data: IAutoBeAnalyzeSectionReviewApplicationWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    props.cyclinic.getPreliminary();
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeSectionReviewApplicationProps> => {
    input = repairSectionReviewInput(input);
    const result: IValidation<IAutoBeAnalyzeSectionReviewApplicationProps> =
      typia.validate<IAutoBeAnalyzeSectionReviewApplicationProps>(input);
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
      typia.llm.application<IAutoBeAnalyzeSectionReviewApplication>({
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
    } satisfies IAutoBeAnalyzeSectionReviewApplication,
  };
}

const SOURCE = "analyzeSectionReview" satisfies AutoBeEventSource;
