/**
 * Repair utilities for section review orchestrators.
 *
 * Handles common LLM output issues (especially Qwen models) where nested
 * objects are emitted as JSON strings instead of real JS values, or where the
 * payload structure is flattened.
 *
 * Shared by both per-file and cross-file section review orchestrators.
 */
import {
  isRecord,
  parseLooseStructuredString,
  tryParseStringAsRecord,
} from "./repairUtils";

/**
 * Master repair entry-point for section review input.
 *
 * Called from `validate()` before `typia.validate` in both
 * `orchestrateAnalyzeSectionReview` and
 * `orchestrateAnalyzeSectionCrossFileReview`.
 */
export const repairSectionReviewInput = (input: unknown): unknown => {
  if (isRecord(input) === false) return input;

  const root: Record<string, unknown> = { ...input };

  // Gap 1: request is a JSON string instead of an object
  if (typeof root.request === "string") {
    root.request = tryParseStringAsRecord(root.request);
  }

  // Gap 2: flattened payload — fileResults at top level without request wrapper
  if (isRecord(root.request) === false && Array.isArray(root.fileResults)) {
    const { thinking, fileResults, type, ...rest } = root;
    return {
      thinking,
      request: { type: type ?? "complete", fileResults },
      ...rest,
    };
  }

  // Gap 2b: flattened getPreviousAnalysisSections
  if (
    isRecord(root.request) === false &&
    typeof root.type === "string" &&
    root.type === "getPreviousAnalysisSections" &&
    root.sectionIds !== undefined
  ) {
    const { thinking, type, sectionIds, ...rest } = root;
    return { thinking, request: { type, sectionIds }, ...rest };
  }

  if (isRecord(root.request) === false) return root;

  const request = root.request as Record<string, unknown>;

  // Gap 3: heuristic type detection
  if (
    request.type !== "complete" &&
    request.type !== "getPreviousAnalysisSections"
  ) {
    if (
      Array.isArray(request.fileResults) ||
      typeof request.fileResults === "string"
    ) {
      request.type = "complete";
    } else if (
      Array.isArray(request.sectionIds) &&
      (request.sectionIds as unknown[]).length > 0
    ) {
      request.type = "getPreviousAnalysisSections";
    } else if (
      typeof request.type === "string" ||
      request.type === null ||
      request.type === undefined
    ) {
      request.type = "complete";
    }
  }

  // Gap 4: fileResults is a JSON string
  if (typeof request.fileResults === "string") {
    const parsed = parseLooseStructuredString(request.fileResults as string);
    if (Array.isArray(parsed)) request.fileResults = parsed;
  }

  // Gap 5: normalize each fileResult
  if (Array.isArray(request.fileResults)) {
    request.fileResults = (request.fileResults as unknown[]).map(
      normalizeFileResult,
    );
  }

  root.request = request;
  return root;
};

/** Normalize a single file result entry. */
const normalizeFileResult = (item: unknown): unknown => {
  if (isRecord(item) === false) return item;
  const fr: Record<string, unknown> = { ...item };

  // fileIndex string → number
  if (typeof fr.fileIndex === "string") {
    const n = Number(fr.fileIndex);
    if (Number.isFinite(n)) fr.fileIndex = n;
  }

  // rejectedModuleUnits string → array
  if (typeof fr.rejectedModuleUnits === "string") {
    const parsed = parseLooseStructuredString(fr.rejectedModuleUnits as string);
    if (Array.isArray(parsed)) fr.rejectedModuleUnits = parsed;
  }

  // revisedSections string → array
  if (typeof fr.revisedSections === "string") {
    const parsed = parseLooseStructuredString(fr.revisedSections as string);
    if (Array.isArray(parsed)) fr.revisedSections = parsed;
  }

  // issues string → array
  if (typeof fr.issues === "string") {
    const parsed = parseLooseStructuredString(fr.issues as string);
    if (Array.isArray(parsed)) fr.issues = parsed;
  }

  // normalize rejectedModuleUnits items
  if (Array.isArray(fr.rejectedModuleUnits)) {
    fr.rejectedModuleUnits = (fr.rejectedModuleUnits as unknown[]).map(
      normalizeRejectedUnit,
    );
  }

  return fr;
};

/** Normalize a single rejected module/unit entry. */
const normalizeRejectedUnit = (item: unknown): unknown => {
  if (isRecord(item) === false) return item;
  const ru: Record<string, unknown> = { ...item };

  // moduleIndex string → number
  if (typeof ru.moduleIndex === "string") {
    const n = Number(ru.moduleIndex);
    if (Number.isFinite(n)) ru.moduleIndex = n;
  }

  // unitIndices string → array
  if (typeof ru.unitIndices === "string") {
    const parsed = parseLooseStructuredString(ru.unitIndices as string);
    if (Array.isArray(parsed)) ru.unitIndices = parsed;
  }

  // unitIndices items string → number
  if (Array.isArray(ru.unitIndices)) {
    ru.unitIndices = (ru.unitIndices as unknown[]).map((v) => {
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
      }
      return v;
    });
  }

  // sectionIndicesPerUnit string → object
  if (typeof ru.sectionIndicesPerUnit === "string") {
    const parsed = parseLooseStructuredString(
      ru.sectionIndicesPerUnit as string,
    );
    if (isRecord(parsed)) ru.sectionIndicesPerUnit = parsed;
  }

  // issues string → array
  if (typeof ru.issues === "string") {
    const parsed = parseLooseStructuredString(ru.issues as string);
    if (Array.isArray(parsed)) ru.issues = parsed;
  }

  return ru;
};
