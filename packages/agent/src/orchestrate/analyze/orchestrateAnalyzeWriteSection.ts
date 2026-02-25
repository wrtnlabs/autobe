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
import { detectTechLockin } from "./utils/buildHardValidators";
import { detectInventedEntities } from "./utils/detectInventedEntities";
import { transformAnalyzeWriteSectionHistory } from "./histories/transformAnalyzeWriteSectionHistory";
import { IAutoBeAnalyzeWriteSectionApplication } from "./structures/IAutoBeAnalyzeWriteSectionApplication";

export const orchestrateAnalyzeWriteSection = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    allUnitEvents: AutoBeAnalyzeWriteUnitEvent[];
    moduleIndex: number;
    unitIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
    attributeRegistry?: string;
    scenarioEntityNames?: string[];
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
        attributeRegistry: props.attributeRegistry,
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
  scenarioEntityNames?: string[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplication.IProps> => {
    input = repairAnalyzeWriteSectionInput(input);
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
              expected:
                `Only entities from scenario catalog: ${props.scenarioEntityNames!.join(", ")}`,
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
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeAnalyzeWriteSectionApplication,
  };
}

const SOURCE = "analyzeWriteSection" satisfies AutoBeEventSource;

const repairAnalyzeWriteSectionInput = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;
  if (isRecord(input.request) === false) return input;

  const request = { ...input.request } as Record<string, unknown>;
  let changed = false;

  if (request.type === "") {
    request.type = "complete";
    changed = true;
  }

  if (
    request.sectionSections === undefined &&
    Array.isArray(request.sections)
  ) {
    request.sectionSections = request.sections;
    changed = true;
  }

  if (typeof request.moduleIndex === "string" && /^\d+$/.test(request.moduleIndex)) {
    request.moduleIndex = Number(request.moduleIndex);
    changed = true;
  }
  if (typeof request.unitIndex === "string" && /^\d+$/.test(request.unitIndex)) {
    request.unitIndex = Number(request.unitIndex);
    changed = true;
  }

  if (Array.isArray(request.sectionSections)) {
    const sections = request.sectionSections;
    const repaired = sections.map((section) => {
      if (isRecord(section) === false) return section;
      let localChanged = false;
      const next = { ...section } as Record<string, unknown>;
      if (typeof next.title === "string") {
        const trimmed = next.title.trim();
        if (trimmed !== next.title) {
          next.title = trimmed;
          localChanged = true;
        }
      }
      if (typeof next.content === "string") {
        const trimmed = next.content.trim();
        if (trimmed !== next.content) {
          next.content = trimmed;
          localChanged = true;
        }
      }
      if (
        next.content === undefined &&
        typeof next.body === "string"
      ) {
        next.content = next.body.trim();
        localChanged = true;
      }
      return localChanged ? next : section;
    });
    if (repaired.some((v, i) => v !== sections[i])) {
      request.sectionSections = repaired;
      changed = true;
    }
  }

  if (!changed) return input;
  return {
    ...input,
    request,
  };
};

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && Array.isArray(input) === false;
