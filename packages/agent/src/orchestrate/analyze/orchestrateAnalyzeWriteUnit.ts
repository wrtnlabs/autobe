import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFileScenario,
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
import { transformAnalyzeWriteUnitHistory } from "./histories/transformAnalyzeWriteUnitHistory";
import {
  IAutoBeAnalyzeWriteUnitApplication,
  IAutoBeAnalyzeWriteUnitApplicationComplete,
  IAutoBeAnalyzeWriteUnitApplicationProps,
} from "./structures/IAutoBeAnalyzeWriteUnitApplication";
import {
  isRecord,
  parseLooseStructuredString,
  tryParseStringAsRecord,
} from "./utils/repairUtils";

export const orchestrateAnalyzeWriteUnit = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeWriteUnitEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeAnalyzeWriteUnitApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteUnitApplicationComplete | null> =
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
      ...transformAnalyzeWriteUnitHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        moduleIndex: props.moduleIndex,
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
  pointer: IPointer<IAutoBeAnalyzeWriteUnitApplicationComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteUnitApplicationProps> => {
    input = repairAnalyzeWriteUnitInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteUnitApplicationProps> =
      typia.validate<IAutoBeAnalyzeWriteUnitApplicationProps>(input);
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

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR CHAIN
// Each helper is pure: it returns the input unchanged when it has nothing to do.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gap 1 — Flattened payload: LLM emits top-level fields instead of `{ request:
 * { type, moduleIndex, unitSections } }`.
 */
const repairFlattenedPayload = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  if (isRecord(input.request)) return input;

  const hasUnitSections =
    Array.isArray(input.unitSections) || Array.isArray(input.sections);
  const completeLike =
    hasUnitSections &&
    (input.type === "complete" ||
      input.type === "" ||
      input.type === undefined ||
      input.type === null);

  if (completeLike) {
    const { thinking, type, moduleIndex, unitSections, sections, ...rest } =
      input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type: "complete",
        moduleIndex,
        unitSections: unitSections ?? sections,
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
  if (t === "complete" || t === "getPreviousAnalysisSections") return request;

  if (Array.isArray(request.unitSections) || Array.isArray(request.sections)) {
    return { ...request, type: "complete" };
  }

  if (Array.isArray(request.sectionIds) && request.sectionIds.length > 0) {
    return { ...request, type: "getPreviousAnalysisSections" };
  }

  if (typeof t === "string" || t === null || t === undefined) {
    return { ...request, type: "complete" };
  }

  return request;
};

/** Gaps 3, 4, 6 — numeric coercion, alias / null / stringified-array repairs. */
const normalizeWriteUnitRequest = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = { ...input };

  // String → number coercion for moduleIndex
  if (typeof output.moduleIndex === "string") {
    const n = Number(output.moduleIndex);
    if (Number.isFinite(n)) output.moduleIndex = n;
  }

  // Alias: sections → unitSections
  if (output.unitSections === undefined && Array.isArray(output.sections)) {
    output.unitSections = output.sections;
  }

  // null → undefined
  if (output.unitSections === null) {
    output.unitSections = undefined;
  }

  // JSON-string unitSections
  if (typeof output.unitSections === "string") {
    const parsed = parseLooseStructuredString(output.unitSections);
    if (Array.isArray(parsed)) output.unitSections = parsed;
  }

  return output;
};

/**
 * Gap 5 + per-item repairs (trim, body/description→content alias, keywords
 * normalization).
 */
const normalizeUnitSectionItems = (sections: unknown[]): unknown[] => {
  return sections.map((item): unknown => {
    if (isRecord(item)) {
      const next = { ...item };
      let changed = false;

      for (const key of ["title", "purpose", "content"] as const) {
        if (typeof next[key] === "string") {
          const trimmed = (next[key] as string).trim();
          if (trimmed !== next[key]) {
            next[key] = trimmed;
            changed = true;
          }
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

      // Keywords normalization
      if (next.keywords === null || next.keywords === undefined) {
        next.keywords = [];
        changed = true;
      } else if (typeof next.keywords === "string") {
        next.keywords = (next.keywords as string)
          .split(",")
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0);
        changed = true;
      } else if (Array.isArray(next.keywords)) {
        const cleaned = (next.keywords as unknown[])
          .map((k: unknown) => (typeof k === "string" ? k.trim() : String(k)))
          .filter((k: string) => k.length > 0);
        if (
          cleaned.length !== (next.keywords as unknown[]).length ||
          cleaned.some(
            (k: string, i: number) => k !== (next.keywords as string[])[i],
          )
        ) {
          next.keywords = cleaned;
          changed = true;
        }
      }

      return changed ? next : item;
    }

    // Plain string → object
    if (typeof item === "string") {
      return { title: "", purpose: "", content: item.trim(), keywords: [] };
    }

    return item;
  });
};

/** Master repair entry-point called from `validate()` before typia.validate. */
export const repairAnalyzeWriteUnitInput = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;

  // Gap 1: reconstruct { request: {...} } wrapper if missing
  const root = repairFlattenedPayload(input);

  // LLMs (e.g. Qwen) sometimes send `request` as a JSON string
  root.request = tryParseStringAsRecord(root.request);
  if (isRecord(root.request) === false) return root;

  // Gap 2 + 3 + 4 + 6: normalize the request record
  let request = normalizeWriteUnitRequest(
    repairRequestType(root.request as Record<string, unknown>),
  );

  // Gap 5 + 7: normalize individual unit section items
  if (Array.isArray(request.unitSections)) {
    request = {
      ...request,
      unitSections: normalizeUnitSectionItems(request.unitSections),
    };
  }

  return { ...root, request };
};
