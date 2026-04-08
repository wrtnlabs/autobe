import { AgentResult } from "../agents";
import type { FixAdvisory } from "./fix-advice";
import type { Issue } from "./issue";

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

/** Score breakdown showing phase vs agent contribution */
export interface ScoreBreakdown {
  phaseScore: number;
  phaseWeight: number;
  phaseContribution: number;
  agentScore: number | null;
  agentWeight: number;
  agentContribution: number;
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
  scoreBreakdown?: ScoreBreakdown;
  /** Code size and performance metrics (reference only) */
  performanceMetrics?: Record<string, number | string>;
  /** Fix advice with code snippets and impact predictions */
  fixAdvisory?: FixAdvisory;
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
