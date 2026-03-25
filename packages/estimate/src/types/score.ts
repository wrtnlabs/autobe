import { AgentResult } from "../agents";
import type { Issue } from "./issue";

export const GATE_ERROR_THRESHOLD = 0.05;
export const GATE_PENALTY_PER_PERCENT = 5;
export const AGENT_WEIGHT_RATIO = 0.15;
export const AGENT_WEIGHTS: Record<string, number> = {
  SecurityAgent: 0.25, // 25% of agent portion — OWASP security audit (lowered: AutoBE auth guards are user-configured)
  LLMQualityAgent: 0.4, // 40% of agent portion — AI code quality patterns (best discriminator)
  HallucinationAgent: 0.35, // 35% of agent portion — spec compliance (OpenAPI + Prisma)
};

// Validate AGENT_WEIGHTS sum to 1.0 at module load
{
  const _weightSum = Object.values(AGENT_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(_weightSum - 1.0) > 0.001) {
    console.warn(
      `[estimate] AGENT_WEIGHTS sum to ${_weightSum}, expected 1.0. Scores may be inaccurate.`,
    );
  }
}

/** Evaluation grade */
export type Grade = "A" | "B" | "C" | "D" | "F";

/** Evaluation phase */
export type Phase =
  // Gate
  | "gate"
  // New scoring phases (affects score)
  | "documentQuality"
  | "requirementsCoverage"
  | "testCoverage"
  | "logicCompleteness"
  | "apiCompleteness"
  // Legacy phases (reference only, no score impact)
  | "requirements"
  | "database"
  | "api"
  | "test"
  | "implementation"
  | "functionality"
  | "quality"
  | "safety"
  | "llmSpecific"
  | "goldenSet";

/** New phase weights (total = 100%) */
export const PHASE_WEIGHTS: Record<Phase, number> = {
  // Gate (pass/fail, no weight)
  gate: 0,
  // New scoring phases
  documentQuality: 0.05, // 5%
  requirementsCoverage: 0.2, // 20%
  testCoverage: 0.25, // 25% (best cross-model discriminator)
  logicCompleteness: 0.35, // 35% (best discriminator of real quality)
  apiCompleteness: 0, // 0% — reference only (AutoBE controller boilerplate gives 100 to all models)
  goldenSet: 0.15, // 15% (runtime functional testing)
  // Legacy (not used in score)
  requirements: 0,
  database: 0,
  api: 0,
  test: 0,
  implementation: 0,
  functionality: 0,
  quality: 0,
  safety: 0,
  llmSpecific: 0,
};

// Validate active PHASE_WEIGHTS sum to 1.0 at module load
{
  const _activeWeightSum = [
    PHASE_WEIGHTS.documentQuality,
    PHASE_WEIGHTS.requirementsCoverage,
    PHASE_WEIGHTS.testCoverage,
    PHASE_WEIGHTS.logicCompleteness,
    PHASE_WEIGHTS.goldenSet,
  ].reduce((a, b) => a + b, 0);
  if (Math.abs(_activeWeightSum - 1.0) > 0.001) {
    console.warn(
      `[estimate] Active PHASE_WEIGHTS sum to ${_activeWeightSum}, expected 1.0. Scores may be inaccurate.`,
    );
  }
}

/** Phase display names */
export const PHASE_NAMES: Record<Phase, string> = {
  gate: "Gate",
  // New scoring phases
  documentQuality: "Document Quality",
  requirementsCoverage: "Requirements Coverage",
  testCoverage: "Test Coverage",
  logicCompleteness: "Logic Completeness",
  apiCompleteness: "API Completeness",
  // Legacy
  requirements: "Requirements (Analyze)",
  database: "DB Design (Database)",
  api: "API Design (Interface)",
  test: "Test (Test)",
  implementation: "Implementation (Realize)",
  functionality: "Functionality",
  quality: "Quality",
  safety: "Safety",
  llmSpecific: "LLM Specific",
  goldenSet: "Golden Set",
};

/** Issue summary for a phase */
export interface IssueSummary {
  code: string;
  count: number;
  message: string;
  severity: "critical" | "warning" | "suggestion";
}

/** Score explanation - why the score is low */
export interface ScoreExplanation {
  reasons: string[];
  issueSummaries: IssueSummary[];
  suggestions: string[];
}

/** Phase evaluation result */
export interface PhaseResult {
  phase: Phase;
  passed: boolean;
  score: number;
  maxScore: number;
  weightedScore: number;
  issues: Issue[];
  durationMs: number;
  metrics?: Record<string, number | string | boolean>;
  explanation?: ScoreExplanation;
}

/** Reference info (no score impact) */
export interface ReferenceInfo {
  complexity: ReferenceInfo.Complexity;
  duplication: ReferenceInfo.Duplication;
  naming: ReferenceInfo.Naming;
  jsdoc: ReferenceInfo.JsDoc;
  schemaSync: ReferenceInfo.SchemaSync;
}
export namespace ReferenceInfo {
  export interface Complexity {
    totalFunctions: number;
    complexFunctions: number;
    maxComplexity: number;
    issues: Issue[];
  }
  export interface Duplication {
    totalBlocks: number;
    issues: Issue[];
  }
  export interface Naming {
    totalIssues: number;
    issues: Issue[];
  }
  export interface JsDoc {
    totalMissing: number;
    totalApis: number;
    issues: Issue[];
  }
  export interface SchemaSync {
    totalTypes: number;
    emptyTypes: number;
    mismatchedProperties: number;
    issues: Issue[];
  }
}

/** Penalty detail types */
export interface WarningPenalty {
  amount: number;
  ratio: string;
}

export interface DuplicationPenalty {
  amount: number;
  blocks: number;
}

export interface JsDocPenalty {
  amount: number;
  missing: number;
  ratio: string;
}

export interface SchemaSyncPenalty {
  amount: number;
  emptyTypes: number;
  mismatchedProperties: number;
}

export interface SuggestionOverflowPenalty {
  amount: number;
  count: number;
}

export interface EvaluationPenalties {
  warning?: WarningPenalty;
  duplication?: DuplicationPenalty;
  jsdoc?: JsDocPenalty;
  schemaSync?: SchemaSyncPenalty;
  suggestionOverflow?: SuggestionOverflowPenalty;
}

/** Final evaluation result */
export interface EvaluationResult {
  targetPath: string;
  totalScore: number;
  grade: Grade;
  phases: EvaluationResult.Phases;
  reference: ReferenceInfo;
  summary: EvaluationResult.Summary;
  criticalIssues: Issue[];
  warnings: Issue[];
  suggestions: Issue[];
  meta: EvaluationResult.Meta;
  penalties?: EvaluationPenalties;
  agentEvaluations?: AgentResult[];
  /** Code size and performance metrics (reference only) */
  performanceMetrics?: Record<string, number | string>;
}
export namespace EvaluationResult {
  export interface Phases {
    gate: PhaseResult;
    documentQuality: PhaseResult;
    requirementsCoverage: PhaseResult;
    testCoverage: PhaseResult;
    logicCompleteness: PhaseResult;
    apiCompleteness: PhaseResult;
    goldenSet?: PhaseResult;
  }
  export interface Summary {
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    suggestionCount: number;
  }
  export interface Meta {
    evaluatedAt: string;
    totalDurationMs: number;
    estimateVersion: string;
    evaluatedFiles: number;
  }
}

/** Convert score to grade */
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Create empty PhaseResult */
export function createEmptyPhaseResult(phase: Phase): PhaseResult {
  return {
    phase,
    passed: true,
    score: 0,
    maxScore: 100,
    weightedScore: 0,
    issues: [],
    durationMs: 0,
  };
}

/** Generate score explanation from issues */
export function generateExplanation(
  issues: Issue[],
  score: number,
): ScoreExplanation {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const issuesByCode = new Map<string, Issue[]>();
  for (const issue of issues) {
    const existing = issuesByCode.get(issue.code) || [];
    existing.push(issue);
    issuesByCode.set(issue.code, existing);
  }

  const issueSummaries: IssueSummary[] = Array.from(issuesByCode).map(
    ([code, codeIssues]) => ({
      code,
      count: codeIssues.length,
      message: codeIssues[0].message,
      severity: codeIssues[0].severity,
    }),
  );

  issueSummaries.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (criticalCount > 0) {
    reasons.push(`${criticalCount} critical issue(s) found`);
    suggestions.push("Fix all critical issues first");
  }

  if (warningCount > 10) {
    reasons.push(`${warningCount} warnings detected`);
    suggestions.push("Address warnings to improve quality");
  }

  for (const summary of issueSummaries.slice(0, 3)) {
    reasons.push(`${summary.count}x ${summary.message}`);
  }

  return { reasons, issueSummaries, suggestions };
}
