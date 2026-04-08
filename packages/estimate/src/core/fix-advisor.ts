import * as fs from "fs";
import * as path from "path";

import type {
  CodeSnippet,
  EvaluationResult,
  FixAdvice,
  FixAdviceSource,
  FixAdvisory,
  Issue,
  PenaltyRecovery,
  Phase,
} from "../types";
import { PHASE_WEIGHTS } from "../types";

/** Number of context lines above/below the target line */
const SNIPPET_CONTEXT_LINES = 3;

/** Maximum number of top fixes to highlight */
const TOP_FIXES_COUNT = 10;

/** Scoring phase keys used in weighted score calculation */
const SCORING_PHASE_KEYS: (keyof EvaluationResult.Phases)[] = [
  "documentQuality",
  "requirementsCoverage",
  "testCoverage",
  "logicCompleteness",
  "apiCompleteness",
];

/** Severity multiplier for impact estimation */
const SEVERITY_MULTIPLIER: Record<string, number> = {
  critical: 1.0,
  warning: 0.6,
  suggestion: 0.2,
};

/** Reference category → pseudo-phase for display */
const REFERENCE_CATEGORY_PHASE: Record<string, Phase> = {
  complexity: "quality",
  duplication: "quality",
  naming: "quality",
  jsdoc: "quality",
  schemaSync: "quality",
};

/**
 * Generate fix advisory from evaluation results.
 *
 * For each issue, estimates the score impact of fixing it and extracts a code
 * snippet from the source file.
 */
export function generateFixAdvisory(
  result: EvaluationResult,
  targetPath: string,
): FixAdvisory {
  const activeKeys = computeActiveKeys(result);
  const activeSum = activeKeys.reduce(
    (sum, k) => sum + (PHASE_WEIGHTS[k] ?? 0),
    0,
  );

  const items: FixAdvice[] = [];
  const seenIds = new Set<string>();

  // 1. Phase issues (gate + scoring phases)
  const allPhaseKeys: (keyof EvaluationResult.Phases)[] = [
    "gate",
    ...SCORING_PHASE_KEYS,
  ];
  if (result.phases.goldenSet) allPhaseKeys.push("goldenSet");

  for (const key of allPhaseKeys) {
    const phaseResult = result.phases[key];
    if (!phaseResult) continue;
    for (const issue of phaseResult.issues) {
      if (seenIds.has(issue.id)) continue;
      seenIds.add(issue.id);

      const estimatedImpact = estimatePhaseImpact(
        issue,
        phaseResult.phase,
        phaseResult.score,
        phaseResult.issues.length,
        activeSum,
      );

      items.push(
        buildAdvice(
          issue,
          phaseResult.phase,
          estimatedImpact,
          "phase",
          targetPath,
        ),
      );
    }
  }

  // 2. Reference evaluator issues (quality metrics → affect penalties)
  const refCategories: Array<{
    key: keyof typeof REFERENCE_CATEGORY_PHASE;
    issues: Issue[];
    penaltyAmount: number;
  }> = [
    {
      key: "complexity",
      issues: result.reference.complexity.issues,
      penaltyAmount: 0,
    },
    {
      key: "duplication",
      issues: result.reference.duplication.issues,
      penaltyAmount: result.penalties?.duplication?.amount ?? 0,
    },
    {
      key: "naming",
      issues: result.reference.naming.issues,
      penaltyAmount: 0,
    },
    {
      key: "jsdoc",
      issues: result.reference.jsdoc.issues,
      penaltyAmount: result.penalties?.jsdoc?.amount ?? 0,
    },
    {
      key: "schemaSync",
      issues: result.reference.schemaSync.issues,
      penaltyAmount: result.penalties?.schemaSync?.amount ?? 0,
    },
  ];

  for (const cat of refCategories) {
    if (cat.issues.length === 0) continue;
    const phase = REFERENCE_CATEGORY_PHASE[cat.key] ?? "quality";
    // Impact = penalty recovery distributed across issues
    const perIssueImpact =
      cat.penaltyAmount > 0 && cat.issues.length > 0
        ? cat.penaltyAmount / cat.issues.length
        : 0.1; // minimal impact for non-penalty reference issues

    for (const issue of cat.issues) {
      if (seenIds.has(issue.id)) continue;
      seenIds.add(issue.id);

      const severityMult = SEVERITY_MULTIPLIER[issue.severity] ?? 0.2;
      const impact = Math.round(perIssueImpact * severityMult * 10) / 10;

      items.push(buildAdvice(issue, phase, impact, "reference", targetPath));
    }
  }

  // Sort by impact descending, assign priority
  items.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  for (let i = 0; i < items.length; i++) {
    items[i].priority = i + 1;
  }

  const totalPotentialGain = Math.min(
    100 - result.totalScore,
    items.reduce((sum, item) => sum + item.estimatedImpact, 0),
  );

  // 3. Penalty recovery opportunities
  const penaltyRecovery = buildPenaltyRecovery(result);

  return {
    items,
    totalPotentialGain: Math.round(totalPotentialGain * 10) / 10,
    topFixes: items.slice(0, TOP_FIXES_COUNT),
    penaltyRecovery: penaltyRecovery.length > 0 ? penaltyRecovery : undefined,
  };
}

/** Build a FixAdvice entry from an issue */
function buildAdvice(
  issue: Issue,
  phase: Phase,
  estimatedImpact: number,
  source: FixAdviceSource,
  targetPath: string,
): FixAdvice {
  const snippet = issue.location
    ? extractSnippet(targetPath, issue.location.file, issue.location.line)
    : undefined;

  return {
    issueId: issue.id,
    phase,
    severity: issue.severity,
    code: issue.code,
    message: issue.message,
    file: issue.location?.file,
    line: issue.location?.line,
    estimatedImpact,
    priority: 0,
    snippet,
    source,
  };
}

/** Get active scoring phase keys (includes goldenSet if present) */
function computeActiveKeys(result: EvaluationResult): Phase[] {
  const keys: Phase[] = [...SCORING_PHASE_KEYS];
  if (result.phases.goldenSet) keys.push("goldenSet");
  return keys;
}

/**
 * Estimate score improvement from fixing one phase issue.
 *
 * Formula: distributes the "lost points" of a phase proportionally across its
 * issues, weighted by severity.
 */
function estimatePhaseImpact(
  issue: Issue,
  phase: Phase,
  phaseScore: number,
  phaseIssueCount: number,
  activeWeightSum: number,
): number {
  if (phaseIssueCount === 0) return 0;

  const phaseWeight = PHASE_WEIGHTS[phase] ?? 0;

  // Gate issues: estimate based on gate penalty spread
  if (phase === "gate") {
    const severityMult = SEVERITY_MULTIPLIER[issue.severity] ?? 0.2;
    return (
      Math.round(((2 * severityMult) / Math.max(1, phaseIssueCount)) * 10) / 10
    );
  }

  const lostPoints = 100 - phaseScore;
  const normalizedWeight =
    activeWeightSum > 0 ? phaseWeight / activeWeightSum : 0;
  const severityMult = SEVERITY_MULTIPLIER[issue.severity] ?? 0.2;

  const rawImpact =
    (lostPoints * normalizedWeight * severityMult) / phaseIssueCount;

  return Math.round(rawImpact * 10) / 10;
}

/** Build penalty recovery opportunities from result.penalties */
function buildPenaltyRecovery(result: EvaluationResult): PenaltyRecovery[] {
  const recovery: PenaltyRecovery[] = [];
  if (!result.penalties) return recovery;

  const p = result.penalties;
  if (p.warning && p.warning.amount > 0) {
    recovery.push({
      type: "warning",
      currentPenalty: p.warning.amount,
      description: `Reduce warnings (current ratio: ${p.warning.ratio}) to recover up to ${p.warning.amount} points`,
    });
  }
  if (p.duplication && p.duplication.amount > 0) {
    recovery.push({
      type: "duplication",
      currentPenalty: p.duplication.amount,
      description: `Reduce ${p.duplication.blocks} duplicate blocks to recover up to ${p.duplication.amount} points`,
    });
  }
  if (p.jsdoc && p.jsdoc.amount > 0) {
    recovery.push({
      type: "jsdoc",
      currentPenalty: p.jsdoc.amount,
      description: `Add JSDoc to ${p.jsdoc.missing} missing APIs (${p.jsdoc.ratio}) to recover up to ${p.jsdoc.amount} points`,
    });
  }
  if (p.schemaSync && p.schemaSync.amount > 0) {
    recovery.push({
      type: "schemaSync",
      currentPenalty: p.schemaSync.amount,
      description: `Fix ${p.schemaSync.emptyTypes} empty types and ${p.schemaSync.mismatchedProperties} mismatched properties to recover up to ${p.schemaSync.amount} points`,
    });
  }
  if (p.suggestionOverflow && p.suggestionOverflow.amount > 0) {
    recovery.push({
      type: "suggestionOverflow",
      currentPenalty: p.suggestionOverflow.amount,
      description: `Address ${p.suggestionOverflow.count} suggestions to recover up to ${p.suggestionOverflow.amount} points`,
    });
  }

  return recovery;
}

/** Extract a code snippet from a source file around a given line. */
function extractSnippet(
  targetPath: string,
  file: string,
  line?: number,
): CodeSnippet | undefined {
  if (!line) return undefined;

  const filePath = path.isAbsolute(file) ? file : path.join(targetPath, file);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const allLines = content.split("\n");

    const startLine = Math.max(1, line - SNIPPET_CONTEXT_LINES);
    const endLine = Math.min(allLines.length, line + SNIPPET_CONTEXT_LINES);

    const lines: CodeSnippet.Line[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push({
        lineNumber: i,
        text: allLines[i - 1],
        isTarget: i === line,
      });
    }

    return { lines, language: "typescript" };
  } catch {
    return undefined;
  }
}
