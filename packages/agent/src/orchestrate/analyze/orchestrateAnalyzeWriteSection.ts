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
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsageComponent } from "../../context/AutoBeTokenUsageComponent";
import { validateSectionSectionContent } from "../../utils/validateEnglishOnly";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
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

const MAX_WRITE_ATTEMPTS = 3;

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
  const preliminary: AutoBePreliminaryController<"previousAnalysisSections"> =
    new AutoBePreliminaryController({
      application:
        typia.json.application<IAutoBeAnalyzeWriteSectionApplication>(),
      source: SOURCE,
      kinds: ["previousAnalysisSections"],
      state: ctx.state(),
    });

  // Write-validate-correct loop state
  let lastWrite: IAutoBeAnalyzeWriteSectionApplicationWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const sourceId = v7();

  const maxIterations = MAX_WRITE_ATTEMPTS * 3;

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeAnalyzeWriteSectionApplicationWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        preliminary,
        writeSucceeded,
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
        preliminary,
        failures,
        writeSucceeded,
      }),
    });

    // PRELIMINARY — delegate and continue
    if (action.value === null) {
      await orchestratePreliminary(ctx, {
        source_id: sourceId,
        source: SOURCE,
        preliminary,
        trial: i + 1,
        histories: result.histories,
      });
      continue;
    }

    // WRITE — validate externally
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const errors: IValidation.IError[] = validateWriteContent(
        writeData,
        props.scenarioEntityNames,
      );

      if (errors.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ errors, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `analyzeWriteSection: exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const event: AutoBeAnalyzeWriteSectionEvent = {
        type: SOURCE,
        id: v7(),
        moduleIndex: lastWrite.moduleIndex,
        unitIndex: lastWrite.unitIndex,
        sectionSections: lastWrite.sectionSections,
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
      return event;
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    const event: AutoBeAnalyzeWriteSectionEvent = {
      type: SOURCE,
      id: v7(),
      moduleIndex: lastWrite.moduleIndex,
      unitIndex: lastWrite.unitIndex,
      sectionSections: lastWrite.sectionSections,
      acquisition: preliminary.getAcquisition(),
      tokenUsage: new AutoBeTokenUsageComponent(),
      metric: AutoBeFunctionCallingMetricFactory.create(),
      step: (ctx.state().analyze?.step ?? -1) + 1,
      total: props.progress.total,
      completed: ++props.progress.completed,
      retry: props.retry,
      created_at: new Date().toISOString(),
    };
    ctx.dispatch(event);
    return event;
  }
  throw new Error("analyzeWriteSection: exhausted all iterations");
};

// ── Types ──

interface IWriteFailure {
  errors: IValidation.IError[];
  iteration: number;
}

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
  preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
  writeSucceeded: boolean;
  action: IPointer<
    | { type: "write"; data: IAutoBeAnalyzeWriteSectionApplicationWrite }
    | { type: "complete" }
    | null
  >;
  scenarioEntityNames?: string[];
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> => {
    input = repairAnalyzeWriteSectionInput(input);
    const result: IValidation<IAutoBeAnalyzeWriteSectionApplicationProps> =
      typia.validate<IAutoBeAnalyzeWriteSectionApplicationProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking ?? "",
        request: req,
      });
    return result;
  };

  let application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeAnalyzeWriteSectionApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  application = fixCompleteAvailability(application, props.writeSucceeded);

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

// ── Schema manipulation ──

/** Removes IComplete from the request union when no write has succeeded. */
function fixCompleteAvailability(
  application: ILlmApplication,
  writeSucceeded: boolean,
): ILlmApplication {
  if (writeSucceeded) return application;

  const func = application.functions.find((f) => f.name === "process");
  if (func === undefined) return application;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return application;
  if (LlmTypeChecker.isAnyOf(request) === false) return application;

  // biome-ignore lint: type narrowing insufficient after isAnyOf guard
  const anyOfSchema = request as ILlmSchema.IAnyOf;
  const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
  // biome-ignore lint: x-discriminator is a runtime extension property
  const mapping: Record<string, string> =
    (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
    null
      ? ((
          (anyOfSchema as unknown as Record<string, unknown>)[
            "x-discriminator"
          ] as Record<string, Record<string, string>>
        ).mapping ?? {})
      : {};

  const completeIdx = children.findIndex(
    (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
  );
  if (completeIdx !== -1) children.splice(completeIdx, 1);
  delete mapping["complete"];

  return application;
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
    preliminary: AutoBePreliminaryController<"previousAnalysisSections">;
    failures: IWriteFailure[];
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

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] Content validation errors:\n` +
      f.errors
        .map(
          (e) =>
            `  - ${e.path}: expected ${e.expected}, got ${JSON.stringify(e.value)}`,
        )
        .join("\n"),
    created_at: new Date().toISOString(),
  }));

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
