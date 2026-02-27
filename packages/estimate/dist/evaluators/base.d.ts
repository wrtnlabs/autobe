import type { Phase, PhaseResult, EvaluationContext, Issue } from '../types';
/**
 * Base evaluator abstract class
 * All evaluators must extend this class
 */
export declare abstract class BaseEvaluator {
    /** Evaluator name */
    abstract readonly name: string;
    /** Target phase */
    abstract readonly phase: Phase;
    /** Evaluator description */
    abstract readonly description: string;
    /**
     * Run evaluation
     */
    abstract evaluate(context: EvaluationContext): Promise<PhaseResult>;
    /**
     * Time measurement wrapper
     */
    protected measureTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        durationMs: number;
    }>;
    /**
     * Calculate score based on issues
     * - Critical: -20 points
     * - Warning: -5 points
     * - Suggestion: -1 point
     */
    protected calculateScore(issues: Issue[], baseScore?: number): number;
    /**
     * Log output (for verbose mode)
     */
    protected log(message: string, verbose?: boolean): void;
}
/**
 * Gate evaluator abstract class
 * Gate only determines pass/fail
 */
export declare abstract class GateEvaluator extends BaseEvaluator {
    readonly phase: Phase;
    /**
     * Check gate pass status
     */
    abstract checkGate(context: EvaluationContext): Promise<{
        passed: boolean;
        issues: Issue[];
        metrics?: Record<string, number | string | boolean>;
    }>;
    evaluate(context: EvaluationContext): Promise<PhaseResult>;
}
//# sourceMappingURL=base.d.ts.map