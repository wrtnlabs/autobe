import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeModuleReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeModuleReviewHistory } from "./histories/transformAnalyzeModuleReviewHistory";
import { IAutoBeAnalyzeModuleReviewApplication } from "./structures/IAutoBeAnalyzeModuleReviewApplication";

/**
 * Orchestrate cross-file review of module sections across ALL files.
 *
 * This function reviews all files' module sections together in a single LLM
 * call, providing cross-file validation for consistency and uniformity.
 */
export const orchestrateAnalyzeModuleReview = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    allFileModules: Array<{
      file: AutoBeAnalyzeFile.Scenario;
      moduleEvent: AutoBeAnalyzeWriteModuleEvent;
      status: "approved" | "rewritten" | "new";
    }>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeModuleReviewEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeModuleReviewApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeModuleReviewApplication.IComplete | null> =
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
      ...transformAnalyzeModuleReviewHistory(ctx, {
        scenario: props.scenario,
        allFileModules: props.allFileModules,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeModuleReviewEvent = {
      type: SOURCE,
      id: v7(),
      fileResults: pointer.value.fileResults,
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
  pointer: IPointer<IAutoBeAnalyzeModuleReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeModuleReviewApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeModuleReviewApplication.IProps> =
      typia.validate<IAutoBeAnalyzeModuleReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeModuleReviewApplication>({
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
    } satisfies IAutoBeAnalyzeModuleReviewApplication,
  };
}

const SOURCE = "analyzeModuleReview" satisfies AutoBeEventSource;
