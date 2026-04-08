import type { EvaluationResult, Issue, ReferenceInfo } from "../types";
import { MAX_COMBINED_PENALTY } from "../types";

export interface PenaltyInput {
  warnings: Issue[];
  suggestions: Issue[];
  reference: ReferenceInfo;
  totalFiles: number;
  verbose?: boolean;
}

export interface PenaltyOutput {
  effectivePenalty: number;
  penalties: EvaluationResult["penalties"];
}

/**
 * Calculate all quality penalties proportionally, capped at
 * MAX_COMBINED_PENALTY.
 *
 * Five penalty types:
 *
 * 1. Warning penalty (max 20) — non-infra, non-gate-penalized warnings
 * 2. Duplication penalty (max 5)
 * 3. JSDoc penalty (max 5)
 * 4. Schema sync penalty (max 10)
 * 5. Suggestion overflow penalty (max 10)
 */
export function calculatePenalties(input: PenaltyInput): PenaltyOutput {
  const { warnings, suggestions, reference, verbose } = input;
  const totalFiles = input.totalFiles || 1;

  const INFRA_WARNING_PATTERNS = [
    "NestiaSimulator",
    "PlainFetcher",
    "MyGlobal",
    "unsupported extension",
  ];
  const isGatePenalizedWarning = (w: Issue) =>
    /^TS\d+$/.test(w.code) || /^P\d+$/.test(w.code);
  const realWarnings = warnings.filter(
    (w) =>
      !INFRA_WARNING_PATTERNS.some((p) => w.message.includes(p)) &&
      !isGatePenalizedWarning(w),
  );

  // 1. Warning penalty (max 20)
  const warningRatio = realWarnings.length / totalFiles;
  const warningThreshold = Math.min(
    0.35,
    0.2 + Math.max(0, totalFiles - 50) * 0.001,
  );
  let rawWarningPenalty = 0;
  if (warningRatio > warningThreshold) {
    rawWarningPenalty = Math.min(
      20,
      Math.round((warningRatio - warningThreshold) * 8),
    );
  }

  // 2. Duplication penalty (max 5)
  const dupThreshold = Math.max(30, Math.min(80, Math.round(totalFiles * 0.5)));
  let rawDupPenalty = 0;
  if (reference.duplication.totalBlocks > dupThreshold) {
    rawDupPenalty = Math.min(
      5,
      Math.round((reference.duplication.totalBlocks - dupThreshold) / 20),
    );
  }

  // 3. JSDoc penalty (max 5)
  let rawJsdocPenalty = 0;
  let jsdocRatio = 0;
  if (reference.jsdoc.totalMissing > 0) {
    const jsdocDenom =
      reference.jsdoc.totalApis || reference.jsdoc.totalMissing;
    jsdocRatio = jsdocDenom > 0 ? reference.jsdoc.totalMissing / jsdocDenom : 0;
    if (jsdocRatio > 0.3) {
      const normalizedRatio = Math.min(1, (jsdocRatio - 0.3) / 0.7);
      rawJsdocPenalty = Math.min(5, Math.round(normalizedRatio * 5));
    }
  }

  // 4. Schema sync penalty (max 10)
  let rawSyncPenalty = 0;
  if (reference.schemaSync.totalTypes === 0) {
    rawSyncPenalty = 3;
  }
  const syncTotal = Math.max(reference.schemaSync.totalTypes, 10);
  const emptyRatio = reference.schemaSync.emptyTypes / syncTotal;
  const mismatchRatio = reference.schemaSync.mismatchedProperties / syncTotal;
  const emptyThreshold = Math.min(
    0.25,
    0.15 + Math.max(0, syncTotal - 30) * 0.001,
  );
  const mismatchThreshold = Math.min(
    0.15,
    0.05 + Math.max(0, syncTotal - 30) * 0.001,
  );
  if (emptyRatio > emptyThreshold) {
    rawSyncPenalty += Math.min(5, Math.round(emptyRatio * 10));
  }
  if (mismatchRatio > mismatchThreshold) {
    rawSyncPenalty += Math.min(5, Math.round(mismatchRatio * 10));
  }

  // 5. Suggestion overflow penalty (max 10)
  let rawSuggestionPenalty = 0;
  const suggestionCount = suggestions.length;
  const suggestionThreshold = Math.min(
    1000,
    500 + Math.max(0, totalFiles - 50) * 3,
  );
  if (suggestionCount > suggestionThreshold) {
    const suggestionDivisor = Math.min(
      400,
      150 + Math.max(0, totalFiles - 50) * 1.5,
    );
    rawSuggestionPenalty = Math.min(
      10,
      Math.round((suggestionCount - suggestionThreshold) / suggestionDivisor),
    );
  }

  // Apply proportionally: cap total at MAX_COMBINED_PENALTY
  const rawPenalties = [
    rawWarningPenalty,
    rawDupPenalty,
    rawJsdocPenalty,
    rawSyncPenalty,
    rawSuggestionPenalty,
  ];
  const rawTotal = rawPenalties.reduce((s, p) => s + p, 0);
  const scale =
    rawTotal > MAX_COMBINED_PENALTY ? MAX_COMBINED_PENALTY / rawTotal : 1.0;

  const effectivePenalty = Math.min(
    MAX_COMBINED_PENALTY,
    Math.round(rawTotal * scale),
  );
  const warningPenalty = Math.round(rawWarningPenalty * scale);
  const dupPenalty = Math.round(rawDupPenalty * scale);
  const jsdocPenalty = Math.round(rawJsdocPenalty * scale);
  const syncPenalty = Math.round(rawSyncPenalty * scale);
  const suggestionPenalty = Math.round(rawSuggestionPenalty * scale);

  if (verbose && effectivePenalty > 0) {
    console.log(
      `  Penalties: -${effectivePenalty} (raw ${rawTotal}, cap ${MAX_COMBINED_PENALTY}, scale ${scale.toFixed(2)})`,
    );
  }

  const penaltyData: NonNullable<EvaluationResult["penalties"]> = {};
  if (warningPenalty > 0) {
    penaltyData.warning = {
      amount: warningPenalty,
      ratio: `${(warningRatio * 100).toFixed(0)}%`,
    };
  }
  if (dupPenalty > 0) {
    penaltyData.duplication = {
      amount: dupPenalty,
      blocks: reference.duplication.totalBlocks,
    };
  }
  if (jsdocPenalty > 0) {
    penaltyData.jsdoc = {
      amount: jsdocPenalty,
      missing: reference.jsdoc.totalMissing,
      ratio: `${(jsdocRatio * 100).toFixed(0)}%`,
    };
  }
  if (syncPenalty > 0) {
    penaltyData.schemaSync = {
      amount: syncPenalty,
      emptyTypes: reference.schemaSync.emptyTypes,
      mismatchedProperties: reference.schemaSync.mismatchedProperties,
    };
  }
  if (suggestionPenalty > 0) {
    penaltyData.suggestionOverflow = {
      amount: suggestionPenalty,
      count: suggestionCount,
    };
  }

  return {
    effectivePenalty,
    penalties: Object.keys(penaltyData).length > 0 ? penaltyData : undefined,
  };
}
