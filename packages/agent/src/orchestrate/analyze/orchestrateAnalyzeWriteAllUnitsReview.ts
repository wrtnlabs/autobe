import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeAnalyzeWriteAllUnitsReviewEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteAllUnitsReviewHistories } from "./histories/transformAnalyzeWriteAllUnitsReviewHistories";
import { IAutoBeAnalyzeWriteAllUnitsReviewApplication } from "./structures/IAutoBeAnalyzeWriteAllUnitsReviewApplication";

/**
 * Orchestrate batch review of ALL unit sections for a file.
 *
 * This function reviews all unit sections at once in a single LLM call,
 * providing holistic validation of the entire file's unit structure.
 */
export const orchestrateAnalyzeWriteAllUnitsReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeAnalyzeWriteAllUnitsReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteAllUnitsReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteAllUnitsReviewApplication.IComplete | null> =
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
      ...transformAnalyzeWriteAllUnitsReviewHistories(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvents: props.unitEvents,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteAllUnitsReviewEvent = {
      type: SOURCE,
      id: v7(),
      approved: pointer.value.approved,
      feedback: pointer.value.feedback,
      revisedUnits: pointer.value.revisedUnits,
      tokenUsage: result.tokenUsage,
      metric: result.metric,
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: props.progress.completed,
      created_at: new Date().toISOString(),
    };
    await ctx.dispatch(event);
    return out(result)(event);
  });
};

function createController(props: {
  pointer: IPointer<IAutoBeAnalyzeWriteAllUnitsReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteAllUnitsReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteAllUnitsReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteAllUnitsReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteAllUnitsReviewApplication>({
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
    } satisfies IAutoBeAnalyzeWriteAllUnitsReviewApplication,
  };
}

const SOURCE = "analyzeWriteAllUnitsReview" satisfies AutoBeEventSource;
