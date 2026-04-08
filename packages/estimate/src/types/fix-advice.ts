import type { Severity } from "./issue";
import type { Phase } from "./score";

/** Code snippet surrounding an issue location */
export interface CodeSnippet {
  lines: CodeSnippet.Line[];
  language: string;
}
export namespace CodeSnippet {
  export interface Line {
    lineNumber: number;
    text: string;
    isTarget: boolean;
  }
}

/** Where the issue was detected */
export type FixAdviceSource = "phase" | "reference" | "penalty";

/** Fix advice for a single issue */
export interface FixAdvice {
  issueId: string;
  phase: Phase;
  severity: Severity;
  code: string;
  message: string;
  file?: string;
  line?: number;
  /** Estimated score improvement if this issue is fixed (0~100 scale) */
  estimatedImpact: number;
  /** Priority rank (1 = highest impact) */
  priority: number;
  /** Source code snippet around the issue location */
  snippet?: CodeSnippet;
  /** Where this issue was detected */
  source: FixAdviceSource;
}

/** Penalty recovery estimate */
export interface PenaltyRecovery {
  type: string;
  currentPenalty: number;
  description: string;
}

/** Fix advisory summary attached to EvaluationResult */
export interface FixAdvisory {
  /** All advice entries sorted by priority (highest impact first) */
  items: FixAdvice[];
  /** Estimated total score improvement if all fixable issues are addressed */
  totalPotentialGain: number;
  /** Top N highest-impact fixes */
  topFixes: FixAdvice[];
  /** Penalty recovery opportunities */
  penaltyRecovery?: PenaltyRecovery[];
}
