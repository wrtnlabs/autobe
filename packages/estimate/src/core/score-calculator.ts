import type {
  EvaluationContext,
  EvaluationInput,
  EvaluationResult,
  Issue,
  PhaseResult,
  ReferenceInfo,
} from "../types";
import { GATE_MULTIPLIER_FLOOR, PHASE_WEIGHTS, scoreToGrade } from "../types";
import { type PenaltyInput, calculatePenalties } from "./penalty";

const { version } = require("../../package.json");

/** Phase strategy keys used for scoring */
const SCORING_PHASE_KEYS = [
  "documentQuality",
  "requirementsCoverage",
  "testCoverage",
  "logicCompleteness",
  "apiCompleteness",
] as const;

type EvaluationPhases = EvaluationResult.Phases;

export interface BuildResultInput {
  input: EvaluationInput;
  context: EvaluationContext;
  phases: EvaluationPhases;
  reference: ReferenceInfo;
  startTime: number;
  performanceMetrics?: Record<string, number | string>;
  verbose?: boolean;
}

/**
 * Assemble the final EvaluationResult from phase results, reference info, and
 * calculated score/penalties.
 */
export function buildResult(opts: BuildResultInput): EvaluationResult {
  const {
    input,
    context,
    phases,
    reference,
    startTime,
    performanceMetrics,
    verbose,
  } = opts;

  // Deduplicate issues across all scoring phases
  const scoringIssues = [
    phases.gate.issues,
    ...SCORING_PHASE_KEYS.map((k) => phases[k].issues),
  ].flat();

  const issueMap = new Map<string, Issue>();
  for (const issue of scoringIssues) {
    const key = `${issue.code}:${issue.location?.file || ""}:${issue.location?.line || ""}`;
    if (!issueMap.has(key)) {
      issueMap.set(key, issue);
    }
  }
  const uniqueIssues = [...issueMap.values()];

  const criticalIssues = uniqueIssues.filter((i) => i.severity === "critical");
  const warnings = uniqueIssues.filter((i) => i.severity === "warning");
  const suggestions = uniqueIssues.filter((i) => i.severity === "suggestion");

  let totalScore: number;
  let penalties: EvaluationResult["penalties"];

  if (!phases.gate.passed) {
    totalScore = calculateGateFailedScore(phases.gate);
  } else {
    totalScore = calculateWeightedScore(phases);

    // Apply quality penalties
    const penaltyInput: PenaltyInput = {
      warnings,
      suggestions,
      reference,
      totalFiles: context.files.typescript.length,
      verbose,
    };
    const penaltyResult = calculatePenalties(penaltyInput);
    totalScore = Math.max(0, totalScore - penaltyResult.effectivePenalty);
    penalties = penaltyResult.penalties;
  }

  return {
    targetPath: input.inputPath,
    totalScore,
    grade: scoreToGrade(totalScore),
    phases,
    reference,
    summary: {
      totalIssues: uniqueIssues.length,
      criticalCount: criticalIssues.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length,
    },
    criticalIssues,
    warnings,
    suggestions,
    meta: {
      evaluatedAt: new Date().toISOString(),
      totalDurationMs: Math.round(performance.now() - startTime),
      estimateVersion: version,
      evaluatedFiles: context.files.typescript.length,
    },
    penalties,
    performanceMetrics,
  };
}

/** Partial credit for gate failure based on severity. */
function calculateGateFailedScore(gate: PhaseResult): number {
  const gateMetrics = gate.metrics || {};
  const failedAt = gateMetrics.failedAt as string | undefined;
  if (
    failedAt === "no-source" ||
    failedAt === "no-nestjs-artifacts" ||
    failedAt === "runtime"
  ) {
    return 0;
  }
  // Syntax/type failure: partial credit based on how many files are ok
  const errorRatio = (gateMetrics.errorRatio as number) || 50;
  return Math.min(30, Math.max(0, Math.round(30 * (1 - errorRatio / 100))));
}

/** Calculate weighted score from active phases with gate multiplier. */
function calculateWeightedScore(phases: EvaluationPhases): number {
  const hasGoldenSet = !!phases.goldenSet;
  const activeKeys: string[] = [...SCORING_PHASE_KEYS];
  if (hasGoldenSet) activeKeys.push("goldenSet");

  const activeSum = activeKeys.reduce(
    (sum, k) => sum + (PHASE_WEIGHTS[k as keyof typeof PHASE_WEIGHTS] ?? 0),
    0,
  );
  const normFactor = activeSum > 0 ? 1 / activeSum : 1;

  const safeScore = (v: number | undefined | null) => {
    const n = v ?? 0;
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  };

  let rawScore = activeKeys.reduce(
    (sum, k) =>
      sum +
      safeScore(
        (phases as unknown as Record<string, PhaseResult | undefined>)[k]
          ?.score,
      ) *
        (PHASE_WEIGHTS[k as keyof typeof PHASE_WEIGHTS] ?? 0) *
        normFactor,
    0,
  );

  // Gate soft multiplier with smooth interpolation.
  // Gate passed with no penalty → multiplier 1.0.
  // Gate passed with penalties → ramp from GATE_MULTIPLIER_FLOOR to 1.0.
  // Gate failed → raw multiplier (score/100).
  rawScore = Math.min(100, rawScore);
  const gateScore = phases.gate.score ?? 100;
  const rawGateMultiplier = gateScore / 100;
  const gateMultiplier = phases.gate.passed
    ? gateScore === 100
      ? 1.0
      : GATE_MULTIPLIER_FLOOR + rawGateMultiplier * (1 - GATE_MULTIPLIER_FLOOR)
    : rawGateMultiplier;

  return Math.max(0, Math.round(rawScore * gateMultiplier));
}
