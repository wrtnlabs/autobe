import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyze,
  AutoBeAnalyzeScenarioEvent,
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
import { validateSectionSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteSectionHistory } from "./histories/transformAnalyzeWriteSectionHistory";
import { IAutoBeAnalyzeWriteSectionApplication } from "./structures/IAutoBeAnalyzeWriteSectionApplication";
import { detectTechLockin } from "./utils/buildHardValidators";
import { detectInventedEntities } from "./utils/detectInventedEntities";

export const orchestrateAnalyzeWriteSection = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyze.IFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    allUnitEvents: AutoBeAnalyzeWriteUnitEvent[];
    moduleIndex: number;
    unitIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
    scenarioEntityNames?: string[];
  },
): Promise<AutoBeAnalyzeWriteSectionEvent> => {
  const counter = new Singleton(() => ++props.progress.completed);
  const preliminary: AutoBePreliminaryController<
    "previousAnalysisSections" | "complete"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeAnalyzeWriteSectionApplication>(),
    source: SOURCE,
    kinds: ["previousAnalysisSections", "complete"],
    state: ctx.state(),
    dispatch: (e) => ctx.dispatch(e),
  });
  const event: AutoBeAnalyzeWriteSectionEvent = await preliminary.orchestrate(
    ctx,
    async (out) => {
      const pointer: IPointer<IAutoBeAnalyzeWriteSectionApplication.IWrite | null> =
        {
          value: null,
        };
      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          pointer,
          preliminary,
          scenarioEntityNames: props.scenarioEntityNames,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformAnalyzeWriteSectionHistory(ctx, {
          scenario: props.scenario,
          file: props.file,
          moduleEvent: props.moduleEvent,
          unitEvent: props.unitEvent,
          allUnitEvents: props.allUnitEvents,
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
  pointer: IPointer<IAutoBeAnalyzeWriteSectionApplication.IWrite | null>;
  preliminary: AutoBePreliminaryController<
    "previousAnalysisSections" | "complete"
  >;
  scenarioEntityNames?: string[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplication.IProps> => {
    const result: IValidation<IAutoBeAnalyzeWriteSectionApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionApplication.IProps>(input);
    if (result.success === false) return result;

    // Validate English-only content for complete requests
    if (result.data.request.type === "write") {
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

      // Validate no technology lock-in
      const techViolations = detectTechLockin(
        result.data.request.sectionSections,
      );
      if (techViolations.length > 0) {
        return {
          success: false,
          errors: techViolations.map((error) => ({
            path: "$input.request.sectionSections",
            expected:
              "Technology-neutral content (no specific DB/framework/infrastructure names)",
            value: error,
          })),
          data: result.data,
        };
      }

      // Validate no invented entities (P0-B)
      if (props.scenarioEntityNames && props.scenarioEntityNames.length > 0) {
        const inventionViolations = detectInventedEntities(
          result.data.request.sectionSections,
          props.scenarioEntityNames,
        );
        if (inventionViolations.length > 0) {
          return {
            success: false,
            errors: inventionViolations.map((error) => ({
              path: "$input.request.sectionSections",
              expected: `Only entities from scenario catalog: ${props.scenarioEntityNames!.join(", ")}`,
              value: error,
            })),
            data: result.data,
          };
        }
      }

      return result;
    }

    return props.preliminary.validate({
      thinking: result.data.thinking ?? "",
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
        if (input.request.type === "write") props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeWriteSectionApplication,
  };
}

const SOURCE = "analyzeWriteSection" satisfies AutoBeEventSource;
