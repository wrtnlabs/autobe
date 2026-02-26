import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeEventSource,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { validateUnitSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteUnitPatchHistory } from "./histories/transformAnalyzeWriteUnitPatchHistory";
import { repairAnalyzeWriteUnitInput } from "./orchestrateAnalyzeWriteUnit";
import { IAutoBeAnalyzeWriteUnitApplication } from "./structures/IAutoBeAnalyzeWriteUnitApplication";

export const orchestrateAnalyzeWriteUnitPatch = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    previousUnitEvent: AutoBeAnalyzeWriteUnitEvent;
    feedback: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeWriteUnitEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeWriteUnitApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteUnitApplication.IComplete | null> =
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
      ...transformAnalyzeWriteUnitPatchHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        moduleIndex: props.moduleIndex,
        previousUnitEvent: props.previousUnitEvent,
        feedback: props.feedback,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteUnitEvent = {
      type: SOURCE,
      id: v7(),
      moduleIndex: pointer.value.moduleIndex,
      unitSections: pointer.value.unitSections,
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
  pointer: IPointer<IAutoBeAnalyzeWriteUnitApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteUnitApplication.IProps> => {
    input = repairAnalyzeWriteUnitInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteUnitApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteUnitApplication.IProps>(input);
    if (result.success === false) return result;

    // Validate English-only content for complete requests
    if (result.data.request.type === "complete") {
      const englishValidation = validateUnitSectionContent(
        result.data.request.unitSections,
      );
      if (!englishValidation.valid) {
        return {
          success: false,
          errors: englishValidation.errors.map((error) => ({
            path: "$input.request.unitSections",
            expected: "English-only content (no Chinese, Korean, Japanese)",
            value: error,
          })),
          data: result.data,
        };
      }
      return result;
    }

    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteUnitApplication>({
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
    } satisfies IAutoBeAnalyzeWriteUnitApplication,
  };
}

const SOURCE = "analyzeWriteUnit" satisfies AutoBeEventSource;
