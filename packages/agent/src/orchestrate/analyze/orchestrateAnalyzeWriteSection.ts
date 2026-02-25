import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeScenarioEvent,
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
import { validateSectionSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteSectionHistory } from "./histories/transformAnalyzeWriteSectionHistory";
import { IAutoBeAnalyzeWriteSectionApplication } from "./structures/IAutoBeAnalyzeWriteSectionApplication";

export const orchestrateAnalyzeWriteSection = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeWriteSectionEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteSectionApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteSectionApplication.IComplete | null> =
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
      ...transformAnalyzeWriteSectionHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvent: props.unitEvent,
        moduleIndex: props.moduleIndex,
        unitIndex: props.unitIndex,
        feedback: props.feedback,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteSectionEvent = {
      type: SOURCE,
      id: v7(),
      moduleIndex: pointer.value.moduleIndex,
      unitIndex: pointer.value.unitIndex,
      sectionSections: pointer.value.sectionSections,
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
  pointer: IPointer<IAutoBeAnalyzeWriteSectionApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteSectionApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionApplication.IProps>(input);
    if (result.success === false) return result;

    // Validate English-only content for complete requests
    if (result.data.request.type === "complete") {
      const englishValidation = validateSectionSectionContent(
        result.data.request.sectionSections,
      );
      if (!englishValidation.valid) {
        return {
          success: false,
          errors: englishValidation.errors.map((error) => ({
            path: "$input.request.sectionSections",
            expected: "English-only content (no Chinese, Korean, Japanese)",
            value: error,
          })),
          data: result.data,
        };
      }
      return result;
    }

    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };
  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteSectionApplication>({
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
    } satisfies IAutoBeAnalyzeWriteSectionApplication,
  };
}

const SOURCE = "analyzeWriteSection" satisfies AutoBeEventSource;
