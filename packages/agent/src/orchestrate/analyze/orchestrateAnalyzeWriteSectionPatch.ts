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
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { validateSectionSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteSectionPatchHistory } from "./histories/transformAnalyzeWriteSectionPatchHistory";
import {
  IAutoBeAnalyzeWriteSectionApplication,
  IAutoBeAnalyzeWriteSectionApplicationProps,
  IAutoBeAnalyzeWriteSectionApplicationWrite,
} from "./structures/IAutoBeAnalyzeWriteSectionApplication";
import { detectTechLockin } from "./utils/buildHardValidators";
import { detectInventedEntities } from "./utils/detectInventedEntities";
import {
  isRecord,
  parseLooseStructuredString,
  tryParseStringAsRecord,
} from "./utils/repairUtils";

export const orchestrateAnalyzeWriteSectionPatch = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyze.IFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    previousSectionEvent: AutoBeAnalyzeWriteSectionEvent;
    feedback: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    retry: number;
    scenarioEntityNames?: string[];
    sectionIndices?: number[] | null;
  },
): Promise<AutoBeAnalyzeWriteSectionEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteSectionApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteSectionApplicationWrite | null> =
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
      ...transformAnalyzeWriteSectionPatchHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvent: props.unitEvent,
        moduleIndex: props.moduleIndex,
        unitIndex: props.unitIndex,
        previousSectionEvent: props.previousSectionEvent,
        feedback: props.feedback,
        preliminary,
        sectionIndices: props.sectionIndices,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    // Section-level merge: preserve originals for non-targeted sections
    let finalSectionSections = pointer.value.sectionSections;
    if (
      props.sectionIndices != null &&
      props.sectionIndices.length > 0 &&
      props.previousSectionEvent.sectionSections.length ===
        pointer.value.sectionSections.length
    ) {
      const targetSet = new Set(props.sectionIndices);
      finalSectionSections = pointer.value.sectionSections.map(
        (section, idx) =>
          targetSet.has(idx)
            ? section
            : props.previousSectionEvent.sectionSections[idx]!,
      );
    }

    const event: AutoBeAnalyzeWriteSectionEvent = {
      type: SOURCE,
      id: v7(),
      moduleIndex: pointer.value.moduleIndex,
      unitIndex: pointer.value.unitIndex,
      sectionSections: finalSectionSections,
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
  pointer: IPointer<IAutoBeAnalyzeWriteSectionApplicationWrite | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
  scenarioEntityNames?: string[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> => {
    input = repairAnalyzeWriteSectionInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionApplicationProps>(input);
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

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR CHAIN
// Each helper is pure: it returns the input unchanged when it has nothing to do.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gap 1 — Flattened payload: LLM emits top-level fields instead of `{ request:
 * { type, moduleIndex, unitIndex, sectionSections } }`.
 */
const repairFlattenedPayload = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  if (isRecord(input.request)) return input;

  const hasSectionSections =
    Array.isArray(input.sectionSections) || Array.isArray(input.sections);
  const completeLike =
    hasSectionSections &&
    (input.type === "write" ||
      input.type === "" ||
      input.type === undefined ||
      input.type === null);

  if (completeLike) {
    const {
      thinking,
      type,
      moduleIndex,
      unitIndex,
      sectionSections,
      sections,
      ...rest
    } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type: "write",
        moduleIndex,
        unitIndex,
        sectionSections: sectionSections ?? sections,
      },
    };
  }

  const previousLike =
    typeof input.type === "string" &&
    input.type === "getPreviousAnalysisSections" &&
    input.sectionIds !== undefined;
  if (previousLike) {
    const { thinking, type, sectionIds, ...rest } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: { type, sectionIds },
    };
  }

  return input;
};

/** Gap 2 — Heuristic type detection: fills in missing/wrong `type` field. */
const repairRequestType = (
  request: Record<string, unknown>,
): Record<string, unknown> => {
  const t = request.type;
  if (t === "write" || t === "getPreviousAnalysisSections") return request;

  if (
    Array.isArray(request.sectionSections) ||
    Array.isArray(request.sections)
  ) {
    return { ...request, type: "write" };
  }

  if (Array.isArray(request.sectionIds) && request.sectionIds.length > 0) {
    return { ...request, type: "getPreviousAnalysisSections" };
  }

  if (typeof t === "string" || t === null || t === undefined) {
    return { ...request, type: "write" };
  }

  return request;
};

/** Gaps 3, 4, 6 + existing string/alias repairs. */
const normalizeWriteSectionRequest = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = { ...input };

  if (typeof output.moduleIndex === "string") {
    const n = Number(output.moduleIndex);
    if (Number.isFinite(n)) output.moduleIndex = n;
  }
  if (typeof output.unitIndex === "string") {
    const n = Number(output.unitIndex);
    if (Number.isFinite(n)) output.unitIndex = n;
  }

  if (output.sectionSections === undefined && Array.isArray(output.sections)) {
    output.sectionSections = output.sections;
  }

  // Gap 6: null → undefined
  if (output.sectionSections === null) {
    output.sectionSections = undefined;
  }

  // Gap 3 + 4: JSON-string sectionSections
  if (typeof output.sectionSections === "string") {
    const parsed = parseLooseStructuredString(output.sectionSections);
    if (Array.isArray(parsed)) output.sectionSections = parsed;
  }

  return output;
};

/** Gap 5 + existing per-item repairs (trim, body→content alias). */
const normalizeSectionItems = (sections: unknown[]): unknown[] => {
  return sections.map((item): unknown => {
    if (isRecord(item)) {
      const next = { ...item };
      let changed = false;

      if (typeof next.title === "string") {
        const trimmed = next.title.trim();
        if (trimmed !== next.title) {
          next.title = trimmed;
          changed = true;
        }
      }
      if (typeof next.content === "string") {
        const trimmed = next.content.trim();
        if (trimmed !== next.content) {
          next.content = trimmed;
          changed = true;
        }
      }
      if (next.content === undefined && typeof next.body === "string") {
        next.content = (next.body as string).trim();
        delete next.body;
        changed = true;
      }
      if (next.content === undefined && typeof next.description === "string") {
        next.content = (next.description as string).trim();
        delete next.description;
        changed = true;
      }
      return changed ? next : item;
    }

    // Gap 5: plain string → { title: "", content: string }
    if (typeof item === "string") {
      return { title: "", content: item.trim() };
    }

    return item;
  });
};

/** Master repair entry-point called from `validate()` before typia.validate. */
const repairAnalyzeWriteSectionInput = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;

  // Gap 1: reconstruct { request: {...} } wrapper if missing
  const root = repairFlattenedPayload(input);

  // LLMs (e.g. Qwen) sometimes send `request` as a JSON string
  root.request = tryParseStringAsRecord(root.request);
  if (isRecord(root.request) === false) return root;

  // Gap 2 + 3 + 4 + 6: normalize the request record
  let request = normalizeWriteSectionRequest(
    repairRequestType(root.request as Record<string, unknown>),
  );

  // Gap 5: normalize individual section items
  if (Array.isArray(request.sectionSections)) {
    request = {
      ...request,
      sectionSections: normalizeSectionItems(request.sectionSections),
    };
  }

  return { ...root, request };
};
