import { AgentResult } from "../agents";
import type { Issue } from "./issue";
export declare const GATE_ERROR_THRESHOLD = 0.05;
export declare const GATE_PENALTY_PER_PERCENT = 5;
export declare const AGENT_WEIGHT_RATIO = 0.3;
export declare const AGENT_WEIGHTS: Record<string, number>;
/** Evaluation grade */
export type Grade = "A" | "B" | "C" | "D" | "F";
/** Evaluation phase */
export type Phase = "gate" | "documentQuality" | "requirementsCoverage" | "testCoverage" | "logicCompleteness" | "apiCompleteness" | "requirements" | "database" | "api" | "test" | "implementation" | "functionality" | "quality" | "safety" | "llmSpecific" | "goldenSet";
/** New phase weights (total = 100%) */
export declare const PHASE_WEIGHTS: Record<Phase, number>;
/** Phase display names */
export declare const PHASE_NAMES: Record<Phase, string>;
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
    complexity: {
        totalFunctions: number;
        complexFunctions: number;
        maxComplexity: number;
        issues: Issue[];
    };
    duplication: {
        totalBlocks: number;
        issues: Issue[];
    };
    naming: {
        totalIssues: number;
        issues: Issue[];
    };
    jsdoc: {
        totalMissing: number;
        issues: Issue[];
    };
    security: {
        totalIssues: number;
        issues: Issue[];
    };
}
/** Final evaluation result */
export interface EvaluationResult {
    targetPath: string;
    totalScore: number;
    grade: Grade;
    phases: {
        gate: PhaseResult;
        documentQuality: PhaseResult;
        requirementsCoverage: PhaseResult;
        testCoverage: PhaseResult;
        logicCompleteness: PhaseResult;
        apiCompleteness: PhaseResult;
    };
    reference: ReferenceInfo;
    summary: {
        totalIssues: number;
        criticalCount: number;
        warningCount: number;
        suggestionCount: number;
    };
    criticalIssues: Issue[];
    warnings: Issue[];
    suggestions: Issue[];
    meta: {
        evaluatedAt: string;
        totalDurationMs: number;
        estimateVersion: string;
        evaluatedFiles: number;
    };
    penalties?: {
        warning?: {
            amount: number;
            ratio: string;
        };
        duplication?: {
            amount: number;
            blocks: number;
        };
        jsdoc?: {
            amount: number;
            missing: number;
            ratio: string;
        };
    };
    agentEvaluations?: AgentResult[];
}
/** Convert score to grade */
export declare function scoreToGrade(score: number): Grade;
/** Create empty PhaseResult */
export declare function createEmptyPhaseResult(phase: Phase): PhaseResult;
/** Generate score explanation from issues */
export declare function generateExplanation(issues: Issue[], score: number): ScoreExplanation;
//# sourceMappingURL=score.d.ts.map