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
import { AutoBeFunctionCallingMetricFactory } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsageComponent } from "../../context/AutoBeTokenUsageComponent";
import { validateSectionSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformAnalyzeWriteSectionHistory } from "./histories/transformAnalyzeWriteSectionHistory";
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
  const cyclinic = new AutoBeCyclinicController<"previousAnalysisSections">({
    application:
      typia.json.application<IAutoBeAnalyzeWriteSectionApplication>(),
    source: SOURCE,
    kinds: ["previousAnalysisSections"],
    state: ctx.state(),
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeAnalyzeWriteSectionApplicationWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          cyclinic,
          action,
          scenarioEntityNames: props.scenarioEntityNames,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...buildHistories(ctx, {
          scenario: props.scenario,
          file: props.file,
          moduleEvent: props.moduleEvent,
          unitEvent: props.unitEvent,
          allUnitEvents: props.allUnitEvents,
          moduleIndex: props.moduleIndex,
          unitIndex: props.unitIndex,
          feedback: props.feedback,
          preliminary: context.preliminary,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        }),
      });

      return { result, action: action.value };
    },
    // VALIDATE: content validation
    async (writeData) => {
      const errors = validateWriteContent(
        writeData,
        props.scenarioEntityNames,
      );
      return { success: errors.length === 0, diagnostics: errors };
    },
    // FINALIZE: always dispatch (with empty metrics when exhausted)
    (lastWrite, result) => {
      const event: AutoBeAnalyzeWriteSectionEvent = {
        type: SOURCE,
        id: v7(),
        moduleIndex: lastWrite.moduleIndex,
        unitIndex: lastWrite.unitIndex,
        sectionSections: lastWrite.sectionSections,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        tokenUsage: result?.tokenUsage ?? new AutoBeTokenUsageComponent(),
        metric:
          result?.metric ?? AutoBeFunctionCallingMetricFactory.create(),
        step: (ctx.state().analyze?.step ?? -1) + 1,
        total: props.progress.total,
        completed: ++props.progress.completed,
        retry: props.retry,
        created_at: new Date().toISOString(),
      };
      ctx.dispatch(event);
      return event;
    },
  );
};

// ── External validation ──

function validateWriteContent(
  writeData: IAutoBeAnalyzeWriteSectionApplicationWrite,
  scenarioEntityNames?: string[],
): IValidation.IError[] {
  const errors: IValidation.IError[] = [];

  // English-only validation
  const englishValidation = validateSectionSectionContent(
    writeData.sectionSections,
  );
  if (!englishValidation.valid) {
    errors.push(
      ...englishValidation.errors.map((error) => ({
        path: "$input.request.sectionSections",
        expected: "English-only content (no Chinese, Korean, Japanese)",
        value: error,
      })),
    );
  }

  // Technology lock-in detection
  const techViolations = detectTechLockin(writeData.sectionSections);
  if (techViolations.length > 0) {
    errors.push(
      ...techViolations.map((error) => ({
        path: "$input.request.sectionSections",
        expected:
          "Technology-neutral content (no specific DB/framework/infrastructure names)",
        value: error,
      })),
    );
  }

  // Invented entities detection
  if (scenarioEntityNames && scenarioEntityNames.length > 0) {
    const inventionViolations = detectInventedEntities(
      writeData.sectionSections,
      scenarioEntityNames,
    );
    if (inventionViolations.length > 0) {
      errors.push(
        ...inventionViolations.map((error) => ({
          path: "$input.request.sectionSections",
          expected: `Only entities from scenario catalog: ${scenarioEntityNames.join(", ")}`,
          value: error,
        })),
      );
    }
  }

  return errors;
}

// ── Controller factory ──

function createController(props: {
  cyclinic: AutoBeCyclinicController<"previousAnalysisSections">;
  action: IPointer<
    | { type: "write"; data: IAutoBeAnalyzeWriteSectionApplicationWrite }
    | { type: "complete" }
    | null
  >;
  scenarioEntityNames?: string[];
}): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> => {
    input = repairAnalyzeWriteSectionInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionApplicationProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking ?? "",
        request: req,
      });
    return result;
  };

  const application = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeAnalyzeWriteSectionApplication>({
        validate: { process: validate },
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
    } satisfies IAutoBeAnalyzeWriteSectionApplication,
  };
}

// ── History builder ──

function buildHistories(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyze.IFileScenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    allUnitEvents: AutoBeAnalyzeWriteUnitEvent[];
    moduleIndex: number;
    unitIndex: number;
    feedback?: string;
    preliminary: AutoBeCyclinicController.IProcessContext<"previousAnalysisSections">["preliminary"];
    failures: AutoBeCyclinicController.IFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = transformAnalyzeWriteSectionHistory(ctx, {
    scenario: props.scenario,
    file: props.file,
    moduleEvent: props.moduleEvent,
    unitEvent: props.unitEvent,
    allUnitEvents: props.allUnitEvents,
    moduleIndex: props.moduleIndex,
    unitIndex: props.unitIndex,
    feedback: props.feedback,
    preliminary: props.preliminary,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => {
    const errors = f.diagnostics as IValidation.IError[];
    return {
      id: v7(),
      type: "systemMessage" as const,
      text:
        `[Write attempt ${f.iteration + 1} FAILED] Content validation errors:\n` +
        errors
          .map(
            (e) =>
              `  - ${e.path}: expected ${e.expected}, got ${JSON.stringify(e.value)}`,
          )
          .join("\n"),
      created_at: new Date().toISOString(),
    };
  });

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed content validation successfully. " +
            "You may now call complete(confirm: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
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
  const writeLike =
    hasSectionSections &&
    (input.type === "write" ||
      input.type === "complete" ||
      input.type === "" ||
      input.type === undefined ||
      input.type === null);

  if (writeLike) {
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
  if (t === "write" || t === "complete" || t === "getPreviousAnalysisSections")
    return request;

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
