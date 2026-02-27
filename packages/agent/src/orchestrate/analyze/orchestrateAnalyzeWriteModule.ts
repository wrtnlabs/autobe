import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
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
import { validateModuleSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformAnalyzeWriteModuleHistory } from "./histories/transformAnalyzeWriteModuleHistory";
import { IAutoBeAnalyzeWriteModuleApplication } from "./structures/IAutoBeAnalyzeWriteModuleApplication";
import { isRecord, parseLooseStructuredString } from "./utils/repairUtils";

export const orchestrateAnalyzeWriteModule = async (
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    feedback?: string;
    retry: number;
  },
): Promise<AutoBeAnalyzeWriteModuleEvent> => {
  const preliminary: AutoBePreliminaryController<"previousAnalysisFiles"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteModuleApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisFiles"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeAnalyzeWriteModuleApplication.IComplete | null> =
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
      ...transformAnalyzeWriteModuleHistory(ctx, {
        scenario: props.scenario,
        file: props.file,
        feedback: props.feedback,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeAnalyzeWriteModuleEvent = {
      type: SOURCE,
      id: v7(),
      title: pointer.value.title,
      summary: pointer.value.summary,
      moduleSections: pointer.value.moduleSections,
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
  pointer: IPointer<IAutoBeAnalyzeWriteModuleApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<"previousAnalysisFiles">;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteModuleApplication.IProps> => {
    input = repairAnalyzeWriteModuleInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteModuleApplication.IProps> =
      typia.validate<IAutoBeAnalyzeWriteModuleApplication.IProps>(input);
    if (result.success === false) return result;

    // Validate English-only content for complete requests
    if (result.data.request.type === "complete") {
      const englishValidation = validateModuleSectionContent(
        result.data.request.moduleSections,
      );
      if (!englishValidation.valid) {
        return {
          success: false,
          errors: englishValidation.errors.map((error) => ({
            path: "$input.request.moduleSections",
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
    typia.llm.application<IAutoBeAnalyzeWriteModuleApplication>({
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
    } satisfies IAutoBeAnalyzeWriteModuleApplication,
  };
}

const SOURCE = "analyzeWriteModule" satisfies AutoBeEventSource;

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR CHAIN
// Each helper is pure: it returns the input unchanged when it has nothing to do.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gap 1 — Flattened payload: LLM emits top-level fields instead of `{ request:
 * { type, title, summary, moduleSections } }`.
 */
const repairFlattenedPayload = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  if (isRecord(input.request)) return input;

  const hasModuleSections =
    Array.isArray(input.moduleSections) || Array.isArray(input.sections);
  const completeLike =
    hasModuleSections &&
    (input.type === "complete" ||
      input.type === "" ||
      input.type === undefined ||
      input.type === null);

  if (completeLike) {
    const {
      thinking,
      type,
      title,
      summary,
      moduleSections,
      sections,
      ...rest
    } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: {
        type: "complete",
        title,
        summary,
        moduleSections: moduleSections ?? sections,
      },
    };
  }

  const previousLike =
    typeof input.type === "string" &&
    input.type === "getPreviousAnalysisFiles" &&
    input.fileNames !== undefined;
  if (previousLike) {
    const { thinking, type, fileNames, ...rest } = input;
    return {
      ...rest,
      ...(thinking !== undefined ? { thinking } : {}),
      request: { type, fileNames },
    };
  }

  return input;
};

/** Gap 2 — Heuristic type detection: fills in missing/wrong `type` field. */
const repairRequestType = (
  request: Record<string, unknown>,
): Record<string, unknown> => {
  const t = request.type;
  if (t === "complete" || t === "getPreviousAnalysisFiles") return request;

  if (
    Array.isArray(request.moduleSections) ||
    Array.isArray(request.sections)
  ) {
    return { ...request, type: "complete" };
  }

  if (Array.isArray(request.fileNames) && request.fileNames.length > 0) {
    return { ...request, type: "getPreviousAnalysisFiles" };
  }

  if (typeof t === "string" || t === null || t === undefined) {
    return { ...request, type: "complete" };
  }

  return request;
};

/** Gaps 3, 4, 6 — alias / null / stringified-array repairs. */
const normalizeWriteModuleRequest = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = { ...input };

  // Alias: sections → moduleSections
  if (output.moduleSections === undefined && Array.isArray(output.sections)) {
    output.moduleSections = output.sections;
  }

  // null → undefined
  if (output.moduleSections === null) {
    output.moduleSections = undefined;
  }

  // JSON-string moduleSections
  if (typeof output.moduleSections === "string") {
    const parsed = parseLooseStructuredString(output.moduleSections);
    if (Array.isArray(parsed)) output.moduleSections = parsed;
  }

  return output;
};

/** Gap 5 + per-item repairs (trim, body/description→content alias). */
const normalizeModuleSectionItems = (sections: unknown[]): unknown[] => {
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
      return changed ? next : item;
    }

    // Plain string → object with content
    if (typeof item === "string") {
      return { title: "", purpose: "", content: item.trim() };
    }

    return item;
  });
};

/** Master repair entry-point called from `validate()` before typia.validate. */
const repairAnalyzeWriteModuleInput = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;

  // Gap 1: reconstruct { request: {...} } wrapper if missing
  const root = repairFlattenedPayload(input);

  if (isRecord(root.request) === false) return root;

  // Gap 2 + 3 + 4 + 6: normalize the request record
  let request = normalizeWriteModuleRequest(
    repairRequestType(root.request as Record<string, unknown>),
  );

  // Gap 5: normalize individual module section items
  if (Array.isArray(request.moduleSections)) {
    request = {
      ...request,
      moduleSections: normalizeModuleSectionItems(request.moduleSections),
    };
  }

  return { ...root, request };
};
